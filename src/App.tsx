
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Whitelist from './pages/Whitelist';
import Analytics from './pages/Analytics';
import StudentAnalytics from './pages/StudentAnalytics';
import Users from './pages/Users';
import RoleAccess from './pages/RoleAccess';
import EditUser from './pages/EditUser';
import Assessments from './pages/Assessments';
import AssessmentEdit from './pages/AssessmentEdit';
import AssessmentView from './pages/AssessmentView';
import SecurityLogs from './pages/SecurityLogs';
import Settings from './pages/Settings';
import SubjectManagement from './pages/SubjectManagement';
import SubjectEdit from './pages/SubjectEdit';
import SubjectView from './pages/SubjectView';
import Layout from './components/Layout';
import type { User } from './types';
import { UserRole } from './types';
import { THEMES } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTheme, setActiveTheme] = useState(THEMES[0]);
  const navigate = useNavigate();

  // Initialize Auth & Theme
  useEffect(() => {
    // 1. Auth Setup
    const savedUser = localStorage.getItem('mastery_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    // 2. Theme Setup
    const savedTheme = localStorage.getItem('mastery_theme');
    if (savedTheme) {
      const parsed = JSON.parse(savedTheme);
      handleThemeChange(parsed);
    } else {
      handleThemeChange(THEMES[0]);
    }
  }, []);

  const handleThemeChange = (theme: typeof THEMES[0]) => {
    setActiveTheme(theme);
    localStorage.setItem('mastery_theme', JSON.stringify(theme));
    
    const colorMap: Record<string, string> = {
      'CVSU Standard': '221.2 83.2% 53.3%',
      'Forest Green': '142.1 76.2% 36.3%',
      'Modern Dark': '222.2 47.4% 11.2%',
      'Midnight Purple': '262.1 83.3% 57.8%',
    };
    
    if (colorMap[theme.name]) {
      document.documentElement.style.setProperty('--primary', colorMap[theme.name]);
    }
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('mastery_user', JSON.stringify(userData));
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mastery_user');
    navigate('/login');
  };

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  const isAdmin = user.role === UserRole.ADMIN;

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      activeTheme={activeTheme}
    >
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Subject Management Cluster */}
        <Route path="/subjects" element={<SubjectManagement user={user} />} />
        <Route path="/subjects/new" element={<SubjectEdit user={user} />} />
        <Route path="/subjects/edit/:id" element={<SubjectEdit user={user} />} />
        <Route path="/subjects/view/:id" element={<SubjectView user={user} />} />

        {/* User Management Cluster */}
        <Route path="/users" element={isAdmin ? <Users /> : <Navigate to="/dashboard" />} />
        <Route path="/users/roles" element={isAdmin ? <RoleAccess /> : <Navigate to="/dashboard" />} />
        <Route path="/users/edit/:id" element={<EditUser loggedInUser={user} />} />

        {/* Whitelist */}
        <Route path="/whitelist" element={isAdmin ? <Whitelist /> : <Navigate to="/dashboard" />} />
        
        {/* Assessment Management Cluster */}
        <Route path="/assessments" element={<Assessments user={user} />} />
        <Route path="/assessments/create" element={<AssessmentEdit user={user} />} />
        <Route path="/assessments/edit/:id" element={<AssessmentEdit user={user} />} />
        <Route path="/assessments/view/:id" element={<AssessmentView user={user} />} />
        
        {/* Analytics Cluster */}
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/analytics/:studentId" element={<StudentAnalytics />} />
        
        <Route path="/security" element={isAdmin ? <SecurityLogs /> : <Navigate to="/dashboard" />} />
        
        <Route 
          path="/settings" 
          element={
            <Settings 
              user={user} 
              activeTheme={activeTheme} 
              onThemeChange={handleThemeChange} 
            />
          } 
        />
        
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Layout>
  );
};

export default App;
