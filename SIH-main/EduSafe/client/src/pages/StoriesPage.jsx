import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/axios';
import { FaHeart, FaShare, FaPlus, FaTimes } from 'react-icons/fa';

const StoriesPage = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [likedStories, setLikedStories] = useState(new Set());
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    image: ''
  });

  useEffect(() => {
    fetchStories();
  }, []);

  // Check like status for all stories
  useEffect(() => {
    if (stories.length > 0) {
      checkLikeStatus();
    }
  }, [stories]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stories');
      setStories(response.data.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch stories');
      setLoading(false);
      console.error('Stories fetch error:', err);
    }
  };

  const checkLikeStatus = async () => {
    try {
      const likeStatusPromises = stories.map(story => 
        api.get(`/stories/${story._id}/like-status`)
      );
      
      const responses = await Promise.all(likeStatusPromises);
      const likedStoryIds = new Set();
      
      responses.forEach((response, index) => {
        if (response.data.success && response.data.data.hasLiked) {
          likedStoryIds.add(stories[index]._id);
        }
      });
      
      setLikedStories(likedStoryIds);
    } catch (err) {
      console.error('Error checking like status:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim())
        : [];
      
      const storyData = {
        ...formData,
        tags: tagsArray
      };
      
      await api.post('/stories', storyData);
      
      // Reset form and close modal
      setFormData({
        title: '',
        content: '',
        tags: '',
        image: ''
      });
      setShowModal(false);
      
      // Refresh stories
      fetchStories();
    } catch (err) {
      console.error('Error creating story:', err);
      alert('Failed to create story. Please try again.');
    }
  };

  const handleLike = async (id) => {
    try {
      const isLiked = likedStories.has(id);
      
      if (isLiked) {
        // Unlike the story
        await api.delete(`/stories/${id}/like`);
        
        // Update UI
        setStories(stories.map(story => 
          story._id === id 
            ? { ...story, likes: Math.max(0, story.likes - 1) } 
            : story
        ));
        
        // Remove from liked stories
        setLikedStories(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      } else {
        // Like the story
        await api.post(`/stories/${id}/like`);
        
        // Update UI
        setStories(stories.map(story => 
          story._id === id 
            ? { ...story, likes: story.likes + 1 } 
            : story
        ));
        
        // Add to liked stories
        setLikedStories(prev => new Set([...prev, id]));
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      if (err.response?.data?.error) {
        alert(err.response.data.error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex justify-center items-center">
        <div className="text-center bg-white rounded-2xl p-12 shadow-lg border border-slate-200">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600 mx-auto mb-6"></div>
          <h3 className="text-2xl font-semibold text-slate-800 mb-3">Loading Success Stories</h3>
          <p className="text-slate-600">Please wait while we fetch the latest stories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex justify-center items-center">
        <div className="text-center bg-white rounded-2xl p-12 shadow-lg border border-red-200 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold text-red-600 mb-3">Unable to Load Stories</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <button 
            onClick={fetchStories}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
              <Link
                to="/dashboard"
                className="text-slate-600 hover:text-blue-600 transition duration-200 font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/leaderboard"
                className="text-slate-600 hover:text-blue-600 transition duration-200 font-medium"
              >
                Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-indigo-400/10"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-slate-800 mb-6">
              Inspiring Stories
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Learning from others’ experience saves time and helps us avoid unnecessary failures.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg flex items-center mx-auto hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
            >
              <FaPlus className="mr-2" /> Share Your Story
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 my-10 pb-12">

      {/* Stories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {stories.map((story, index) => (
          <div 
            key={story._id} 
            className="group bg-white rounded-xl shadow-lg hover:shadow-xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 border border-slate-200"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Story Image */}
            {story.image ? (
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={story.image} 
                  alt={story.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
            ) : (
              <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <div className="text-4xl text-white opacity-80">📖</div>
              </div>
            )}
            
            {/* Story Content */}
            <div className="p-6">
              <h2 className="text-xl font-bold mb-3 text-slate-800 group-hover:text-blue-600 transition-colors">
                {story.title}
              </h2>
              <p className="text-slate-600 mb-4 leading-relaxed text-sm">
                {story.content.length > 120 
                  ? `${story.content.substring(0, 120)}...` 
                  : story.content}
              </p>
              
              {/* Tags */}
              {story.tags && story.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {story.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-md font-medium border border-blue-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Author and Date */}
              <div className="flex justify-between items-center text-sm text-slate-500 mb-4">
                <span className="flex items-center">
                  <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                    {story.authorName.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-medium">{story.authorName}</span>
                </span>
                <span className="text-xs bg-slate-100 px-3 py-1 rounded-md">
                  {new Date(story.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button 
                  onClick={() => handleLike(story._id)}
                  className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                    likedStories.has(story._id) 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600'
                  }`}
                >
                  <FaHeart className={`mr-2 ${likedStories.has(story._id) ? 'fill-current' : ''}`} /> 
                  <span className="font-medium text-sm">{story.likes}</span>
                </button>
                {/* <button className="flex items-center px-4 py-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200">
                  <FaShare className="mr-2" /> 
                  <span className="font-medium text-sm">Share</span>
                </button> */}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Story Submission Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">
                Share Your Story
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-slate-700 mb-3 font-semibold">Story Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  placeholder="Enter a compelling title for your story..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-slate-700 mb-3 font-semibold">Your Story</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-32 resize-none"
                  placeholder="Share your educational journey, achievements, or insights that could inspire others..."
                  required
                ></textarea>
              </div>
              
              <div>
                <label className="block text-slate-700 mb-3 font-semibold">Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  placeholder="academic, research, internship, leadership, innovation"
                />
                <p className="text-sm text-slate-500 mt-2">Separate tags with commas to help others find your story</p>
              </div>
              
              <div>
                <label className="block text-slate-700 mb-3 font-semibold">Image URL (Optional)</label>
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  placeholder="https://example.com/your-image.jpg"
                />
              </div>
              
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg font-medium"
                >
                  Share Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default StoriesPage;