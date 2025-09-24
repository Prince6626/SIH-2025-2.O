import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminQuizPanel = () => {
  const [modules, setModules] = useState([]);
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    difficulty: 'beginner',
    duration: '1 week',
    estimatedHours: 2,
    category: 'Disaster',
    tags: '',
    thumbnail: '',
    introVideoUrl: '',
    isPublished: true,
    isActive: true,
    notes: ''
  });
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('modules');
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>
        <div className="flex justify-end mb-4">
          <button
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
            onClick={() => {
              try {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
              } catch {}
              navigate('/login');
            }}
          >
            Logout
          </button>
        </div>

        {/* Section Switcher */}
        <div className="bg-white border rounded-lg p-2 mb-6 flex items-center gap-2">
          <button
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeSection === 'modules' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setActiveSection('modules')}
          >
            Modules
          </button>
          <button
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeSection === 'quiz' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setActiveSection('quiz')}
          >
            Quiz
          </button>
        </div>

        {activeSection === 'modules' && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create or Edit Disaster Module</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Module to Edit (optional)</label>
            <div className="flex gap-2">
              <select
                className="flex-1 border rounded-md p-2"
                value={selectedModuleId}
                onChange={(e)=>{
                  const val = e.target.value;
                  setSelectedModuleId(val);
                  if(!val){
                    setModuleForm({title:'',description:'',difficulty:'beginner',duration:'1 week',estimatedHours:2,category:'Disaster',tags:'',thumbnail:'',introVideoUrl:'',isPublished:true,isActive:true,notes:''});
                    return;
                  }
                  const found = modules.find(m=>m._id===val);
                  if(found){
                    setModuleForm({
                      title: found.title || '',
                      description: found.description || '',
                      difficulty: found.difficulty || 'beginner',
                      duration: found.duration || '1 week',
                      estimatedHours: Number(found.estimatedHours ?? 2),
                      category: found.category || 'Disaster',
                      tags: Array.isArray(found.tags) ? found.tags.join(', ') : (found.tags || ''),
                      thumbnail: found.thumbnail || '',
                      introVideoUrl: found.introVideoUrl || '',
                      isPublished: Boolean(found.isPublished),
                      isActive: Boolean(found.isActive),
                      notes: found.notes || ''
                    });
                  }
                }}
              >
                <option value="">-- Choose a module --</option>
                {modules.map(m => (
                  <option key={m._id} value={m._id}>{m.title}</option>
                ))}
              </select>
              <button
                type="button"
                className="px-3 py-2 text-sm border rounded-md text-gray-700 hover:bg-gray-100"
                onClick={()=>{
                  setSelectedModuleId('');
                  setModuleForm({title:'',description:'',difficulty:'beginner',duration:'1 week',estimatedHours:2,category:'Disaster',tags:'',thumbnail:'',introVideoUrl:'',isPublished:true,isActive:true,notes:''});
                }}
              >Clear</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Title</label>
              <input className="w-full border rounded-md p-2" value={moduleForm.title} onChange={(e)=>setModuleForm(p=>({...p,title:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Difficulty</label>
              <select className="w-full border rounded-md p-2" value={moduleForm.difficulty} onChange={(e)=>setModuleForm(p=>({...p,difficulty:e.target.value}))}>
                <option value="beginner">beginner</option>
                <option value="intermediate">intermediate</option>
                <option value="advanced">advanced</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Description</label>
              <textarea rows={3} className="w-full border rounded-md p-2" value={moduleForm.description} onChange={(e)=>setModuleForm(p=>({...p,description:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Duration</label>
              <input className="w-full border rounded-md p-2" value={moduleForm.duration} onChange={(e)=>setModuleForm(p=>({...p,duration:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Estimated Hours</label>
              <input type="number" min={0.5} step={0.5} className="w-full border rounded-md p-2" value={moduleForm.estimatedHours} onChange={(e)=>setModuleForm(p=>({...p,estimatedHours:Number(e.target.value)}))} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Category</label>
              <input className="w-full border rounded-md p-2" value={moduleForm.category} onChange={(e)=>setModuleForm(p=>({...p,category:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Tags (comma separated)</label>
              <input className="w-full border rounded-md p-2" value={moduleForm.tags} onChange={(e)=>setModuleForm(p=>({...p,tags:e.target.value}))} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Thumbnail URL</label>
              <input className="w-full border rounded-md p-2" value={moduleForm.thumbnail} onChange={(e)=>setModuleForm(p=>({...p,thumbnail:e.target.value}))} />
            </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">Disaster Video URL (optional)</label>
            <input className="w-full border rounded-md p-2" placeholder="https://..." value={moduleForm.introVideoUrl} onChange={(e)=>setModuleForm(p=>({...p,introVideoUrl:e.target.value}))} />
          </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Notes / Study Material</label>
              <textarea rows={6} className="w-full border rounded-md p-2" placeholder="Add detailed notes or study material..." value={moduleForm.notes} onChange={(e)=>setModuleForm(p=>({...p,notes:e.target.value}))} />
            </div>
            <div className="flex items-center gap-4 md:col-span-2">
              <label className="text-sm text-gray-700 flex items-center gap-2">
                <input type="checkbox" checked={moduleForm.isPublished} onChange={(e)=>setModuleForm(p=>({...p,isPublished:e.target.checked}))} /> Published
              </label>
              <label className="text-sm text-gray-700 flex items-center gap-2">
                <input type="checkbox" checked={moduleForm.isActive} onChange={(e)=>setModuleForm(p=>({...p,isActive:e.target.checked}))} /> Active
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md"
              onClick={async()=>{
                try{
                  const payload={...moduleForm,tags:moduleForm.tags?moduleForm.tags.split(',').map(t=>t.trim()).filter(Boolean):[]};
                  const res=await axios.post('http://localhost:5000/api/modules',payload,{headers:authHeaders()});
                  if(res.data.success){
                    alert('Module created');
                    setModuleForm({title:'',description:'',difficulty:'beginner',duration:'1 week',estimatedHours:2,category:'Disaster',tags:'',thumbnail:'',introVideoUrl:'',isPublished:true,isActive:true,notes:''});
                    const reload=await axios.get('http://localhost:5000/api/modules?limit=100');
                    if(reload.data.success){setModules(reload.data.data.modules)}
                  }
                }catch(e){
                  console.error('Create module failed',e); alert('Failed to create module');
                }
              }}
            >Create Module</button>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-60"
              disabled={!selectedModuleId}
              onClick={async()=>{
                try{
                  const payload={...moduleForm,tags:moduleForm.tags?moduleForm.tags.split(',').map(t=>t.trim()).filter(Boolean):[]};
                  const res=await axios.put(`http://localhost:5000/api/modules/${selectedModuleId}`,payload,{headers:authHeaders()});
                  if(res.data.success){
                    alert('Module updated');
                    const reload=await axios.get('http://localhost:5000/api/modules?limit=100');
                    if(reload.data.success){setModules(reload.data.data.modules)}
                  }
                }catch(e){
                  console.error('Update module failed',e); alert('Failed to update module');
                }
              }}
            >Update Selected</button>
          </div>
        </div>
        )}

        {activeSection === 'quiz' && (
        <>
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
        </>
        )}
      </div>
    </div>
  );
};

export default AdminQuizPanel;


