import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTrophy, FaMedal, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const apiBase = (import.meta.env && import.meta.env.VITE_API_BASE_URL ? String(import.meta.env.VITE_API_BASE_URL) : '').replace(/\/+$/, '');
        const url = `${apiBase}/api/users/leaderboard?limit=20`;
        const response = await axios.get(url, { withCredentials: true });
        const dataArray = Array.isArray(response?.data?.data) ? response.data.data : [];
        setLeaderboard(dataArray);
        setLoading(false);
      } catch (err) {
        const msg = err?.response?.data?.error || err?.message || 'Failed to fetch leaderboard data';
        setError(msg);
        setLoading(false);
        console.error('Leaderboard fetch error:', err);
      }
    };

    fetchLeaderboard();
  }, []);

  // Function to render rank badges
  const renderRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return <FaTrophy className="text-yellow-500 text-xl" />;
      case 2:
        return <FaMedal className="text-gray-400 text-xl" />;
      case 3:
        return <FaMedal className="text-amber-700 text-xl" />;
      default:
        return <span className="font-bold text-gray-700">{rank}</span>;
    }
  };

  // Function to determine badge based on points
  const getUserBadge = (points) => {
    if (points >= 1000) return { name: 'Expert', color: 'bg-purple-600' };
    if (points >= 500) return { name: 'Advanced', color: 'bg-blue-600' };
    if (points >= 200) return { name: 'Intermediate', color: 'bg-green-600' };
    return { name: 'Beginner', color: 'bg-gray-600' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/dashboard'))}
          className="inline-flex items-center text-slate-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
          aria-label="Go back"
        >
          <FaArrowLeft className="mr-2" />
          <span>Back</span>
        </button>
        <h1 className="text-3xl font-bold text-center flex-1 -ml-10">Leaderboard</h1>
        <span className="w-[84px]" />
      </div>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center">
          <div className="w-16 text-center font-bold">Rank</div>
          <div className="flex-1 font-bold">User</div>
          <div className="w-24 text-center font-bold">Points</div>
          <div className="w-32 text-center font-bold">Badge</div>
        </div>
        
        {/* Leaderboard List */}
        <div className="divide-y divide-gray-200">
          {leaderboard.length === 0 && (
            <div className="px-6 py-10 text-center text-gray-500">
              No leaderboard data yet. Complete modules and quizzes to earn points!
            </div>
          )}
          {Array.isArray(leaderboard) && leaderboard.map((user, idx) => {
            const safePoints = typeof user?.points === 'number' ? user.points : 0;
            const safeRank = typeof user?.rank === 'number' ? user.rank : idx + 1;
            const safeUsername = typeof user?.username === 'string' && user.username.trim() ? user.username : 'User';
            const safeRole = typeof user?.role === 'string' && user.role.trim() ? user.role : 'student';
            const badge = getUserBadge(safePoints);
            
            return (
              <div 
                key={user?._id || `${safeUsername}-${safeRank}`} 
                className="px-6 py-4 flex items-center hover:bg-gray-50 transition-colors"
              >
                {/* Rank */}
                <div className="w-16 text-center">
                  {renderRankBadge(safeRank)}
                </div>
                
                {/* User */}
                <div className="flex-1 flex items-center">
                  <div className="bg-blue-100 text-blue-800 rounded-full h-10 w-10 flex items-center justify-center font-bold mr-3">
                    {safeUsername.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{safeUsername}</div>
                    <div className="text-sm text-gray-500 capitalize">{safeRole}</div>
                  </div>
                </div>
                
                {/* Points */}
                <div className="w-24 text-center font-semibold">
                  {safePoints}
                </div>
                
                {/* Badge */}
                <div className="w-32 text-center">
                  <span className={`${badge.color} text-white text-xs px-2 py-1 rounded-full`}>
                    {badge.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;