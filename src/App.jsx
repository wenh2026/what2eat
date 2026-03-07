import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserStore } from './store/userStore';
import { supabase } from './lib/supabase';
import { logEvent } from './lib/logger';
import BottomNav from './components/BottomNav';

const Home = lazy(() => import('./pages/Home'));
const Recipe = lazy(() => import('./pages/Recipe'));
const History = lazy(() => import('./pages/History'));
const Vibe = lazy(() => import('./pages/Vibe'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
  const { t } = useTranslation();
  const isDarkMode = useUserStore((state) => state.isDarkMode);
  const setUser = useUserStore((state) => state.setUser);
  const clearUserData = useUserStore((state) => state.clearUserData);
  const hydrateFromSupabase = useUserStore((state) => state.hydrateFromSupabase);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const syncSession = async (session, source) => {
      if (session?.user) {
        setUser(session.user, session);
        logEvent('session_restore_start', { scene: source, user_id: session.user.id, status: 'start' });
        const result = await hydrateFromSupabase();
        if (result?.ok) {
          logEvent('session_restore_success', { scene: source, user_id: session.user.id, status: 'success' });
        } else {
          logEvent('session_restore_fail', {
            scene: source,
            user_id: session.user.id,
            status: 'fail',
            error_code: result?.errorCode || 'HYDRATE_FAILED',
          });
        }
        return;
      }

      clearUserData();
      logEvent('session_restore_fail', { scene: source, status: 'fail', error_code: 'NO_SESSION' });
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      void syncSession(session, 'app_bootstrap');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clearUserData();
        logEvent('auth_sign_out_success', { scene: 'auth_listener', status: 'success' });
        return;
      }
      void syncSession(session, event);
    });

    return () => subscription.unsubscribe();
  }, [clearUserData, hydrateFromSupabase, setUser]);

  return (
    <Router>
      <div className="min-h-screen bg-background-light dark:bg-background-dark pb-nav-safe transition-colors duration-200">
        <Suspense fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="surface-card border rounded-2xl px-5 py-3 text-sm text-muted-ui flex items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-primary text-base">refresh</span>
              <span>{t('app_loading')}</span>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/recipe" element={<Recipe />} />
            <Route path="/history" element={<History />} />
            <Route path="/vibe" element={<Vibe />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Suspense>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
