import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, History, Sparkles, User } from 'lucide-react';

const BottomNav = () => {
  const { t } = useTranslation();

  const navItems = [
    { path: '/', label: t('nav_home'), icon: Home },
    { path: '/history', label: t('nav_history'), icon: History },
    { path: '/vibe', label: t('nav_suggestion'), icon: Sparkles },
    { path: '/profile', label: t('nav_my'), icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 pb-safe pt-2 px-6 z-50 shadow-lg transition-colors duration-200">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {/* eslint-disable-next-line no-unused-vars */}
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 transition-colors duration-200 ${
                isActive ? 'text-primary' : 'text-gray-400 hover:text-primary/70'
              }`
            }
          >
            <Icon size={24} strokeWidth={2.5} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
