import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminQuizPanel = () => {
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    questionText: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    explanation: '',
    points: 1,
    type: 'single-choice',
    timeLimit: 60,
    difficulty: 'medium'
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    if (!token || !user || (user.role !== 'teacher' && user.role !== 'admin')) {
      navigate('/login');
      return;
    }

    const loadModules = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/modules?limit=100');
        if (res.data.success) {
          setModules(res.data.data.modules);
        }
      } catch (e) {
        console.error('Failed to load modules', e);
      }
    };
    loadModules();
  }, [navigate]);

  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const loadQuiz = async (moduleId) => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/modules/${moduleId}/quiz/admin`, {
        headers: authHeaders()
      });
      if (res.data.success) {
        setQuiz(res.data.data.quiz);
      } else {
        setQuiz(null);
      }
    } catch (e) {
      setQuiz(null);
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    setForm(prev => ({ ...prev, options: [...prev.options, { text: '', isCorrect: false }] }));
  };

  const removeOption = (idx) => {
    setForm(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== idx) }));
  };

  const submitQuestion = async () => {
    try {
      if (!selectedModuleId) return;
      const payload = { ...form };
      const res = await axios.post(`http://localhost:5000/api/modules/${selectedModuleId}/quiz/questions`, payload, {
        headers: authHeaders()
      });
      if (res.data.success) {
        setForm({
          questionText: '',
          options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
          ],
          explanation: '',
          points: 1,
          type: 'single-choice',
          timeLimit: 60,
          difficulty: 'medium'
        });
        await loadQuiz(selectedModuleId);
        alert('Question added');
      }
    } catch (e) {
      console.error('Failed to add question', e);
      alert('Failed to add question');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Quiz Panel</h1>

        <div className="bg-white border rounded-lg p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Module</label>
          <select
            className="w-full border rounded-md p-2"
            value={selectedModuleId}
            onChange={async (e) => {
              const val = e.target.value;
              setSelectedModuleId(val);
              if (val) await loadQuiz(val);
              else setQuiz(null);
            }}
          >
            <option value="">-- Choose a module --</option>
            {modules.map(m => (
              <option key={m._id} value={m._id}>{m.title}</option>
            ))}
          </select>
        </div>

        {selectedModuleId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Add Question</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Question Text</label>
                  <textarea
                    className="w-full border rounded-md p-2"
                    rows={3}
                    value={form.questionText}
                    onChange={(e) => setForm(prev => ({ ...prev, questionText: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Options</label>
                  <div className="space-y-2">
                    {form.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          className="flex-1 border rounded-md p-2"
                          placeholder={`Option ${idx + 1}`}
                          value={opt.text}
                          onChange={(e) => setForm(prev => {
                            const next = { ...prev };
                            next.options[idx].text = e.target.value;
                            return next;
                          })}
                        />
                        <label className="text-sm text-gray-700 flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={opt.isCorrect}
                            onChange={(e) => setForm(prev => {
                              const next = { ...prev };
                              next.options[idx].isCorrect = e.target.checked;
                              return next;
                            })}
                          /> Correct
                        </label>
                        <button
                          className="text-red-600 text-sm"
                          onClick={() => removeOption(idx)}
                        >Remove</button>
                      </div>
                    ))}
                  </div>
                  <button className="mt-2 text-blue-600 text-sm" onClick={addOption}>+ Add option</button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Points</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      className="w-full border rounded-md p-2"
                      value={form.points}
                      onChange={(e) => setForm(prev => ({ ...prev, points: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Time Limit (s)</label>
                    <input
                      type="number"
                      min={10}
                      max={600}
                      className="w-full border rounded-md p-2"
                      value={form.timeLimit}
                      onChange={(e) => setForm(prev => ({ ...prev, timeLimit: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Difficulty</label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={form.difficulty}
                      onChange={(e) => setForm(prev => ({ ...prev, difficulty: e.target.value }))}
                    >
                      <option value="easy">easy</option>
                      <option value="medium">medium</option>
                      <option value="hard">hard</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Explanation (optional)</label>
                  <textarea
                    className="w-full border rounded-md p-2"
                    rows={2}
                    value={form.explanation}
                    onChange={(e) => setForm(prev => ({ ...prev, explanation: e.target.value }))}
                  />
                </div>
                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
                  onClick={submitQuestion}
                  disabled={loading}
                >
                  Add Question
                </button>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Quiz Preview</h2>
              {loading ? (
                <div className="text-gray-500">Loading...</div>
              ) : quiz ? (
                <div className="space-y-4">
                  <div className="text-gray-800 font-semibold">{quiz.title}</div>
                  {quiz.questions?.map((q, i) => (
                    <div key={q._id} className="border rounded-md p-3">
                      <div className="text-sm text-gray-500">Question {i + 1} • {q.points || 1} pts</div>
                      <div className="font-medium text-gray-900 mt-1">{q.questionText}</div>
                      <ul className="list-disc ml-5 mt-2">
                        {q.options?.map(opt => (
                          <li key={opt._id} className={opt.isCorrect ? 'text-green-700' : 'text-gray-700'}>
                            {opt.text} {opt.isCorrect ? '(correct)' : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No quiz found for this module yet. Add a question to create it.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminQuizPanel;


