import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const bloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

const StudentProfile = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    username: '',
    age: '',
    bloodGroup: '',
    parentMobile: '',
    dateOfBirth: '',
    profilePhoto: ''
  });
  const navigate = useNavigate();

  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    if (!user || user.role !== 'student') {
      navigate('/login');
      return;
    }
    loadProfile();
  }, [navigate]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('http://localhost:5000/api/users/me', { headers: authHeaders() });
      if (res.data.success) {
        setProfile(res.data.data);
        const p = res.data.data;
        setForm({
          username: p.username || '',
          age: p.age ?? '',
          bloodGroup: p.bloodGroup || '',
          parentMobile: p.parentMobile || '',
          dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().slice(0,10) : '',
          profilePhoto: p.profilePhoto || ''
        });
      } else {
        setError('Failed to load profile');
      }
    } catch (e) {
      console.error('Load profile failed', e);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const validateClient = () => {
    const errs = [];
    if (!form.username.trim()) errs.push('Username is required');
    const ageNum = Number(form.age);
    if (!form.age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) errs.push('Valid age is required');
    if (!bloodGroups.includes(form.bloodGroup)) errs.push('Valid blood group is required');
    if (!/^\+?[0-9]{7,15}$/.test(form.parentMobile)) errs.push('Valid parent mobile is required');
    if (!form.dateOfBirth) errs.push('Date of birth is required');
    return errs;
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      setFieldErrors([]);
      const pre = validateClient();
      if (pre.length > 0) {
        setFieldErrors(pre);
        setLoading(false);
        return;
      }
      const payload = {
        username: form.username.trim(),
        age: Number(form.age),
        bloodGroup: form.bloodGroup,
        parentMobile: form.parentMobile,
        dateOfBirth: form.dateOfBirth,
        profilePhoto: form.profilePhoto || undefined
      };
      const res = await axios.put('http://localhost:5000/api/users/me', payload, { headers: authHeaders() });
      if (res.data.success) {
        setProfile(res.data.data);
        // update local storage user for username display
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
          const u = JSON.parse(userRaw);
          u.username = res.data.data.username;
          localStorage.setItem('user', JSON.stringify(u));
        }
        alert('Profile updated');
      } else {
        setFieldErrors(['Update failed']);
      }
    } catch (e) {
      console.error('Update profile failed', e);
      const apiErrors = e.response?.data?.errors;
      const message = e.response?.data?.message;
      if (Array.isArray(apiErrors) && apiErrors.length) {
        setFieldErrors(apiErrors);
      } else if (message) {
        setFieldErrors([message]);
      } else {
        setFieldErrors(['Failed to update profile']);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white border rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Student Profile</h1>
          <button
            className="text-sm text-gray-600 hover:text-blue-600"
            onClick={() => navigate('/dashboard')}
          >Back to Dashboard</button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        {fieldErrors.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md mb-4">
            <ul className="list-disc ml-5">
              {fieldErrors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
            {form.profilePhoto ? (
              <img src={form.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">👤</span>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-700 mb-1">Profile Photo URL (optional)</label>
            <input
              className="w-full border rounded-md p-2"
              value={form.profilePhoto}
              onChange={(e)=>setForm(p=>({...p, profilePhoto: e.target.value }))}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Username</label>
            <input className="w-full border rounded-md p-2" value={form.username} onChange={(e)=>setForm(p=>({...p, username: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Age</label>
            <input type="number" min={1} max={120} className="w-full border rounded-md p-2" value={form.age} onChange={(e)=>setForm(p=>({...p, age: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Blood Group</label>
            <select className="w-full border rounded-md p-2" value={form.bloodGroup} onChange={(e)=>setForm(p=>({...p, bloodGroup: e.target.value }))} required>
              <option value="">Select</option>
              {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Parent Mobile</label>
            <input className="w-full border rounded-md p-2" placeholder="+919876543210" value={form.parentMobile} onChange={(e)=>setForm(p=>({...p, parentMobile: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Date of Birth</label>
            <input type="date" className="w-full border rounded-md p-2" value={form.dateOfBirth} onChange={(e)=>setForm(p=>({...p, dateOfBirth: e.target.value }))} required />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-60"
            onClick={saveProfile}
            disabled={loading}
          >Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
