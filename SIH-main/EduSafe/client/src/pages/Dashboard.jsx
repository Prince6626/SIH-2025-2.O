import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [completedModules, setCompletedModules] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Fetch modules
    fetchModules();

    // Load completed modules from localStorage (scoped per user)
    try {
      const currentUser = userData ? JSON.parse(userData) : null;
      const userId = currentUser?.id || currentUser?._id || 'guest';
      const scopedKey = `completedModules:${userId}`;

      // Migrate legacy key if present and scoped missing
      const legacy = localStorage.getItem('completedModules');
      const scopedExisting = localStorage.getItem(scopedKey);
      if (!scopedExisting && legacy) {
        localStorage.setItem(scopedKey, legacy);
        localStorage.removeItem('completedModules');
      }

      const stored = localStorage.getItem(scopedKey);
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) setCompletedModules(arr);
      }
    } catch {}
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      // Try to fetch from API first
      try {
        const response = await axios.get('http://localhost:5000/api/modules');
        
        if (response.data.success) {
          console.log('Modules data:', response.data.data.modules);
          setModules(response.data.data.modules);
          return; // Exit if successful
        } else if (response.data && Array.isArray(response.data)) {
          console.log('Fallback modules data:', response.data);
          setModules(response.data);
          return; // Exit if successful
        }
      } catch (apiErr) {
        console.error('API error:', apiErr);
        // Continue to fallback if API fails
      }
      
      // Fallback: Always set dummy modules if API fails
      console.log('Using fallback dummy modules');
      setModules([
        {
          _id: "dummy1",
          title: "Cyberbullying Awareness",
          description: "Learn about cyberbullying, its impact, and how to prevent it.",
          difficulty: "beginner",
          thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3",
          duration: "2 weeks",
          estimatedHours: 4,
          category: "Online Safety",
          lessonCount: 5
        },
        {
          _id: "dummy2",
          title: "School Safety Fundamentals",
          description: "Essential knowledge about physical safety in school environments.",
          difficulty: "beginner",
          thumbnail: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?ixlib=rb-4.0.3",
          duration: "1 week",
          estimatedHours: 2,
          category: "Physical Safety",
          lessonCount: 3
        },
        {
          _id: "dummy3",
          title: "Mental Health Awareness",
          description: "Understand the importance of mental health and recognize warning signs.",
          difficulty: "intermediate",
          thumbnail: "https://images.unsplash.com/photo-1493836512294-502baa1986e2?ixlib=rb-4.0.3",
          duration: "3 weeks",
          estimatedHours: 6,
          category: "Mental Health",
          lessonCount: 8
        }
      ]);
    } catch (err) {
      console.error('Error in module loading process:', err);
      setError('Failed to load modules. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Clear legacy progress key to avoid cross-user carryover
    localStorage.removeItem('completedModules');
    navigate('/login');
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

  const handleModuleClick = (moduleId) => {
    navigate(`/module/${moduleId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-lg border border-indigo-100">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-6"></div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Loading Amazing Modules...</h3>
          <p className="text-gray-600">🚀 Get ready for an incredible learning journey!</p>
        </div>
      </div>
    );
  }

  // We've moved the dummy module logic to the fetchModules function

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                EduSafe
              </Link>
            </div>
            <div className="flex items-center space-x-8">
              {user && (
                <span className="text-slate-700 font-medium flex items-center">
                  <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                  Welcome, {user.username}
                </span>
              )}
              {(user?.role === 'teacher' || user?.role === 'admin') && (
                <button
                  onClick={() => navigate('/reports-dashboard')}
                  className="text-slate-600 hover:text-blue-600 transition duration-200 font-medium"
                >
                  Reports
                </button>
              )}
              {user?.role === 'student' && (
                <>
                  <button
                    onClick={() => navigate('/report-issue')}
                    className="text-slate-600 hover:text-blue-600 transition duration-200 font-medium"
                  >
                    Report Issue
                  </button>
                  <button
                    onClick={() => navigate('/student/profile')}
                    className="text-slate-600 hover:text-blue-600 transition duration-200 font-medium"
                  >
                    Profile
                  </button>
                </>
              )}
              <button
                onClick={() => navigate('/leaderboard')}
                className="text-slate-600 hover:text-blue-600 transition duration-200 font-medium"
              >
                Leaderboard
              </button>
              <button
                onClick={() => navigate('/stories')}
                className="text-slate-600 hover:text-blue-600 transition duration-200 font-medium"
              >
                Stories
              </button>
              <button 
                onClick={handleLogout}
                className="text-slate-600 hover:text-red-600 transition duration-200 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-slate-800 mb-4">
                Learning Modules
              </h1>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Explore comprehensive educational content designed for students and learners at all levels
              </p>
            </div>
            <div className="flex justify-center space-x-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg border border-slate-200">
                <div className="text-2xl font-bold text-blue-600">{modules.length}</div>
                <div className="text-sm font-medium text-slate-600">Modules Available</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg border border-slate-200">
                <div className="text-2xl font-bold text-green-600">{completedModules.length}</div>
                <div className="text-sm font-medium text-slate-600">Completed</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg border border-slate-200">
                <div className="text-2xl font-bold text-indigo-600">{Math.round((completedModules.length / Math.max(modules.length, 1)) * 100)}%</div>
                <div className="text-sm font-medium text-slate-600">Progress</div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          {/* Modules Grid */}
          {modules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {modules.map((module, index) => (
                <div
                  key={module._id}
                  onClick={() => handleModuleClick(module._id)}
                  className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border border-indigo-100 overflow-hidden"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Module Image/Thumbnail */}
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-t-xl relative overflow-hidden">
                    {module.thumbnail ? (
                      <img
                        src={module.thumbnail}
                        alt={module.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src='https://images.unsplash.com/photo-1523246191915-37fe4ad2cc87?q=80&w=1200&auto=format&fit=crop'; }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-white text-6xl opacity-80 group-hover:scale-105 transition-transform duration-300">📖</div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getDifficultyColor(module.difficulty)} shadow-lg`}>
                        {getDifficultyIcon(module.difficulty)} {module.difficulty}
                      </span>
                    </div>
                    {completedModules.includes(module._id) && (
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-green-500 text-white shadow-lg">
                          Completed
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Module Content */}
                  <div className="p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors mb-3">
                        {module.title}
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {module.description}
                      </p>
                    </div>

                    {/* Module Stats */}
                    <div className="space-y-4">
                      {/* Duration & Hours */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-slate-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">{module.duration}</span>
                        </div>
                        <div className="flex items-center text-slate-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span className="font-medium">{module.estimatedHours}h</span>
                        </div>
                      </div>

                      {/* Category */}
                      <div className="flex items-center text-sm text-slate-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span className="font-medium">{module.category}</span>
                      </div>

                      {/* Instructor */}
                      {module.instructor && (
                        <div className="flex items-center text-sm text-slate-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-medium">{module.instructor.username}</span>
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="mt-6">
                        <div className="flex justify-between text-sm text-slate-600 mb-2">
                          <span className="font-medium">Progress</span>
                          <span className="font-semibold">{completedModules.includes(module._id) ? '100%' : '0%'}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: completedModules.includes(module._id) ? '100%' : '0%' }}
                          ></div>
                        </div>
                      </div>

                      {/* Lesson Count & Action */}
                      <div className="flex items-center justify-between pt-3">
                        {/* <span className="text-sm text-slate-600 font-medium">
                          {module.lessonCount || 0} lessons
                        </span> */}
                        <span className="text-blue-600 font-semibold text-sm group-hover:text-indigo-600 transition-colors">
                          Start Learning →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-lg border border-indigo-100 max-w-md mx-auto">
                <div className="text-8xl mb-6">📚</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  No modules available yet
                </h3>
                <p className="text-gray-600 mb-6">
                  We're working on amazing content for you! Check back soon for exciting learning adventures.
                </p>
                <div className="text-4xl">🚀</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
