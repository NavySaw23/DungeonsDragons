import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Homepage from './pages/Homepage';
import Dashboard from './pages/Dashboard';
import Login from './components/Auth/Login'; 
import Register from './components/Auth/Register';
import PomodoroPage from './pomodoro/PomodoroPage';
import CalendarWidget from './calendar/calendar';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pomodoropage" element={<PomodoroPage />} />
        <Route path="/calendar" element={<CalendarWidget />} />
      </Routes>
    </Router>
  );
}

export default App;