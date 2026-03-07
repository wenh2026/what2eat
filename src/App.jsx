import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useUserStore } from './store/userStore';
import Home from './pages/Home';
import Recipe from './pages/Recipe';
import History from './pages/History';
import Vibe from './pages/Vibe';
import Profile from './pages/Profile';
import BottomNav from './components/BottomNav';

function App() {
  const isDarkMode = useUserStore((state) => state.isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <Router>
      <div className="min-h-screen bg-background-light dark:bg-background-dark pb-nav-safe transition-colors duration-200">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recipe" element={<Recipe />} />
          <Route path="/history" element={<History />} />
          <Route path="/vibe" element={<Vibe />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
