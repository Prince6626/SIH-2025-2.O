import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { FaRobot } from 'react-icons/fa';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ModuleDetailPage from './pages/ModuleDetailPage';
import ReportIssuePage from './pages/ReportIssuePage';
import ReportsDashboard from './pages/ReportsDashboard';
import LeaderboardPage from './pages/LeaderboardPage';
import StoriesPage from './pages/StoriesPage';
import AIChatbot from './pages/AIChatbot';
import AdminQuizPanel from './pages/AdminQuizPanel';
import StudentProfile from './pages/StudentProfile';

function App() {
  const ChatbotButton = () => {
    const location = useLocation();
    if (location.pathname === '/chatbot') return null;
    return (
      <Link
        to="/chatbot"
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
        aria-label="Open Chatbot"
      >
        <FaRobot className="text-xl" />
      </Link>
    );
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/module/:id" element={<ModuleDetailPage />} />
          <Route path="/report-issue" element={<ReportIssuePage />} />
          <Route path="/reports-dashboard" element={<ReportsDashboard />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/stories" element={<StoriesPage />} />
          <Route path="/chatbot" element={<AIChatbot />} />
          <Route path="/admin/quiz" element={<AdminQuizPanel />} />
          <Route path="/student/profile" element={<StudentProfile />} />
        </Routes>
        <ChatbotButton />
      </div>
    </Router>
  );
}

export default App;
