import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LectureView from './pages/LectureView';
import Flashcards from './pages/Flashcards';
import ChatTutor from './pages/ChatTutor';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#0f2139] text-white flex items-center justify-center">Loading...</div>;
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#0f2139] text-white font-sans">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/lecture/:id" element={<PrivateRoute><LectureView /></PrivateRoute>} />
        <Route path="/flashcards/:deckId" element={<PrivateRoute><Flashcards /></PrivateRoute>} />
        <Route path="/chat/:lectureId" element={<PrivateRoute><ChatTutor /></PrivateRoute>} />
      </Routes>
    </div>
  );
}
