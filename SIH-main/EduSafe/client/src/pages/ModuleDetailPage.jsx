import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const ModuleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [module, setModule] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [answers, setAnswers] = useState({}); // { [questionId]: optionId }
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [awardInfo, setAwardInfo] = useState(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetchModuleDetails();
  }, [id]);

  const fetchModuleDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch module details
      const moduleResponse = await axios.get(`http://localhost:5000/api/modules/${id}`);
      if (moduleResponse.data.success) {
        setModule(moduleResponse.data.data.module);
      }

      // Fetch quiz details
      try {
        const quizResponse = await axios.get(`http://localhost:5000/api/modules/${id}/quiz`);
        if (quizResponse.data.success) {
          setQuiz(quizResponse.data.data.quiz);
        }
      } catch (quizError) {
        // Quiz might not exist, that's okay
        console.log('No quiz found for this module');
      }

    } catch (err) {
      console.error('Error fetching module details:', err);
      setError('Failed to load module details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load initial completed state from localStorage
    try {
      const userRaw = localStorage.getItem('user');
      const userObj = userRaw ? JSON.parse(userRaw) : null;
      const userId = userObj?.id || userObj?._id || 'guest';
      const scopedKey = `completedModules:${userId}`;
      const stored = localStorage.getItem(scopedKey);
      if (stored) {
        const arr = JSON.parse(stored);
        setCompleted(Array.isArray(arr) && arr.includes(id));
      } else {
        // fallback migration from legacy
        const legacy = localStorage.getItem('completedModules');
        if (legacy) {
          const arr = JSON.parse(legacy);
          if (Array.isArray(arr) && arr.length > 0) {
            localStorage.setItem(scopedKey, legacy);
            localStorage.removeItem('completedModules');
            setCompleted(arr.includes(id));
          }
        }
      }
    } catch {}
  }, [id]);

  const markModuleCompleted = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`http://localhost:5000/api/modules/${id}/complete`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data?.success) {
        // Save to localStorage (scoped per user)
        const userRaw = localStorage.getItem('user');
        const userObj = userRaw ? JSON.parse(userRaw) : null;
        const userId = userObj?.id || userObj?._id || 'guest';
        const scopedKey = `completedModules:${userId}`;
        const stored = localStorage.getItem(scopedKey);
        let arr = [];
        try { arr = stored ? JSON.parse(stored) : []; } catch (e) { arr = []; }
        if (!arr.includes(id)) arr.push(id);
        localStorage.setItem(scopedKey, JSON.stringify(arr));
        setCompleted(true);
        alert(`Module completed! +${res.data.data.pointsAwarded} points. Total: ${res.data.data.userTotalPoints}`);
      } else {
        alert('Failed to mark completed.');
      }
    } catch (e) {
      console.error('Complete module failed', e);
      alert('Please log in to complete modules.');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return '🟢';
      case 'intermediate':
        return '🟡';
      case 'advanced':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getVideoThumbnail = (url) => {
    const videoId = getVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  };

  const videoLessons = module?.lessons?.filter(lesson => lesson.type === 'video') || [];
  const videoCount = (videoLessons?.length || 0) + (module?.introVideoUrl ? 1 : 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading module details...</p>
        </div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error || 'Module not found'}
          </h3>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-xl font-bold text-blue-600">
                EduSafe
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-500 hover:text-gray-700 transition duration-200"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contents</h3>
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveSection('overview')}
                  className={`w-full text-left px-3 py-2 rounded-md transition duration-200 ${
                    activeSection === 'overview'
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  📋 Overview
                </button>
                <button
                  onClick={() => setActiveSection('videos')}
                  className={`w-full text-left px-3 py-2 rounded-md transition duration-200 ${
                    activeSection === 'videos'
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  🎥 Videos ({videoCount})
                </button>
                <button
                  onClick={() => setActiveSection('notes')}
                  className={`w-full text-left px-3 py-2 rounded-md transition duration-200 ${
                    activeSection === 'notes'
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  📝 Notes
                </button>
                <button
                  onClick={() => setActiveSection('quiz')}
                  className={`w-full text-left px-3 py-2 rounded-md transition duration-200 ${
                    activeSection === 'quiz'
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  🧠 Quiz {quiz ? '' : '(Not Available)'}
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {activeSection === 'overview' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Module Header */}
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {module.title}
                      </h1>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(module.difficulty)}`}>
                          {getDifficultyIcon(module.difficulty)} {module.difficulty}
                        </span>
                        <span>⏱️ {module.duration}</span>
                        <span>📖 {module.lessonCount} lessons</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {completed && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>
                      )}
                      {!completed && (
                        <button
                          onClick={markModuleCompleted}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-3 rounded-lg"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Module Thumbnail (Overview shows image only) */}
                  {module.thumbnail && (
                    <div className="mb-6">
                      <img
                        src={module.thumbnail}
                        alt={module.title}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* Description */}
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">About this module</h2>
                    <p className="text-gray-700 leading-relaxed">{module.description}</p>
                  </div>

                  {/* Module Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">⏱️</div>
                        <div>
                          <div className="text-sm text-gray-600">Duration</div>
                          <div className="font-semibold text-gray-900">{module.estimatedHours}h</div>
                        </div>
                      </div>
                    </div>
                    {/* <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">📚</div>
                        <div>
                          <div className="text-sm text-gray-600">Lessons</div>
                          <div className="font-semibold text-gray-900">{module.lessonCount}</div>
                        </div>
                      </div>
                    </div> */}
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">📂</div>
                        <div>
                          <div className="text-sm text-gray-600">Category</div>
                          <div className="font-semibold text-gray-900">{module.category}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Instructor */}
                  {module.instructor && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructor</h3>
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                          <span className="text-blue-600 font-semibold text-lg">
                            {module.instructor.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{module.instructor.username}</div>
                          <div className="text-sm text-gray-600">{module.instructor.email}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'videos' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Video Lessons</h2>
                
                {videoLessons.length > 0 || module.introVideoUrl ? (
                  <div className="space-y-6">
                    {/* Video Player */}
                    {(selectedVideo || module.introVideoUrl) && (
                      <div className="mb-8">
                        <div className="bg-black rounded-lg overflow-hidden">
                          <iframe
                            width="100%"
                            height="400"
                            src={`https://www.youtube.com/embed/${getVideoId((selectedVideo && selectedVideo.videoUrl) || module.introVideoUrl)}`}
                            title={selectedVideo ? selectedVideo.title : module.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-96"
                          ></iframe>
                        </div>
                        <div className="mt-4">
                          <h3 className="text-xl font-semibold text-gray-900">{selectedVideo ? selectedVideo.title : 'Introduction'}</h3>
                          {selectedVideo && <p className="text-gray-600 mt-2">{selectedVideo.content}</p>}
                        </div>
                      </div>
                    )}

                    {/* Video List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {module.introVideoUrl && (
                        <div
                          onClick={() => setSelectedVideo(null)}
                          className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                            selectedVideo == null ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                          }`}
                        >
                          <div className="relative">
                            <img
                              src={getVideoThumbnail(module.introVideoUrl) || '/api/placeholder/300/200'}
                              alt={`${module.title} intro`}
                              className="w-full h-40 object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                              <div className="bg-white bg-opacity-90 rounded-full p-3">
                                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              </div>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                              Intro
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-1">Introduction</h4>
                            <p className="text-sm text-gray-600 line-clamp-2">Overview video</p>
                          </div>
                        </div>
                      )}
                      {videoLessons.map((lesson, index) => (
                        <div
                          key={lesson._id}
                          onClick={() => setSelectedVideo(lesson)}
                          className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                            selectedVideo?._id === lesson._id
                              ? 'border-blue-500 shadow-lg'
                              : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                          }`}
                        >
                          <div className="relative">
                            <img
                              src={getVideoThumbnail(lesson.videoUrl) || '/api/placeholder/300/200'}
                              alt={lesson.title}
                              className="w-full h-40 object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                              <div className="bg-white bg-opacity-90 rounded-full p-3">
                                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              </div>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                              {lesson.estimatedTime || 5}min
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-1">{lesson.title}</h4>
                            <p className="text-sm text-gray-600 line-clamp-2">{lesson.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎥</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No video lessons available</h3>
                    <p className="text-gray-500">This module doesn't contain any video content yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'notes' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Notes / Study Material</h2>
                {module.notes ? (
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap break-words text-gray-800">{module.notes}</pre>
                  </div>
                ) : (
                  <div className="text-gray-500">No notes available for this module yet.</div>
                )}
              </div>
            )}

            {activeSection === 'quiz' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Quiz</h2>
                
                {quiz ? (
                  <div className="space-y-6">
                    <div className="bg-blue-50 rounded-lg p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{quiz.title}</h3>
                      {quiz.description && (
                        <p className="text-gray-700 mb-4">{quiz.description}</p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{quiz.questionCount}</div>
                          <div className="text-sm text-gray-600">Questions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{quiz.timeLimit}</div>
                          <div className="text-sm text-gray-600">Minutes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{quiz.passingScore}%</div>
                          <div className="text-sm text-gray-600">Passing Score</div>
                        </div>
                      </div>
                    </div>
                    {!quizStarted && !result && (
                      <button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
                        onClick={() => {
                          setQuizStarted(true);
                          setAnswers({});
                          setResult(null);
                        }}
                      >
                        Start Quiz
                      </button>
                    )}

                    {quizStarted && !result && (
                      <div className="space-y-8">
                        {quiz.questions?.sort((a, b) => (a.order || 0) - (b.order || 0)).map((q, qi) => (
                          <div key={q._id} className="bg-white border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="text-sm text-gray-500 mb-1">Question {qi + 1}</div>
                                <div className="font-semibold text-gray-900 mb-2">{q.questionText}</div>
                              </div>
                              <div className="text-xs text-gray-500">{q.points || 1} pts</div>
                            </div>
                            <div className="mt-3 space-y-2">
                              {q.options?.map(opt => (
                                <label key={opt._id} className={`flex items-center p-3 border rounded-md cursor-pointer transition ${answers[q._id] === opt._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                  <input
                                    type="radio"
                                    name={`q-${q._id}`}
                                    className="mr-3"
                                    checked={answers[q._id] === opt._id}
                                    onChange={() => setAnswers(prev => ({ ...prev, [q._id]: opt._id }))}
                                  />
                                  <span className="text-gray-800">{opt.text}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}

                        <button
                          disabled={submitting}
                          onClick={async () => {
                            try {
                              setSubmitting(true);
                              const payload = {
                                answers: Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId }))
                              };
                              const token = localStorage.getItem('token');
                              const res = await axios.post(`http://localhost:5000/api/modules/${id}/quiz/submit`, payload, {
                                headers: token ? { Authorization: `Bearer ${token}` } : {}
                              });
                              if (res.data.success) {
                                setResult(res.data.data);
                                if (res.data.data.pointsAwarded) {
                                  setAwardInfo({
                                    pointsAwarded: res.data.data.pointsAwarded,
                                    userTotalPoints: res.data.data.userTotalPoints
                                  });
                                }
                                setQuizStarted(false);
                              }
                            } catch (e) {
                              console.error('Failed to submit quiz', e);
                              alert('Failed to submit quiz. Please try again.');
                            } finally {
                              setSubmitting(false);
                            }
                          }}
                          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
                        >
                          {submitting ? 'Submitting...' : 'Submit Quiz'}
                        </button>
                      </div>
                    )}

                    {result && (
                      <div className="bg-white border rounded-lg p-6">
                        <div className="text-center mb-6">
                          <div className="text-3xl font-bold text-gray-900 mb-2">Your Score</div>
                          <div className="text-5xl font-extrabold text-blue-600">{result.percentage}%</div>
                          <div className="text-gray-600 mt-2">
                            {result.scorePoints}/{result.totalPoints} points • {result.correctCount}/{result.totalQuestions} correct
                          </div>
                          {awardInfo && (
                            <div className="mt-3 text-green-700 font-medium">
                              +{awardInfo.pointsAwarded} points awarded! Total: {awardInfo.userTotalPoints}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-3 justify-center">
                          <button
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
                            onClick={() => {
                              setResult(null);
                              setQuizStarted(true);
                              setAnswers({});
                            }}
                          >
                            Retake Quiz
                          </button>
                          <button
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg"
                            onClick={() => setActiveSection('overview')}
                          >
                            Back to Overview
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🧠</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No quiz available</h3>
                    <p className="text-gray-500">This module doesn't have a quiz yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleDetailPage;
