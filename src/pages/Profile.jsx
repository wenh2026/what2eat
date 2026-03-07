import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../store/userStore';
import { supabase } from '../lib/supabase';
import Auth from '../components/Auth';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useHeaderMotion } from '../lib/useHeaderMotion';

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser, signOut, isDarkMode, toggleDarkMode } = useUserStore();
  const { isHeaderCompact, isHeaderHidden } = useHeaderMotion({ hideAt: 90 });

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null, session);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null, session);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  if (!user) {
    return (
      <div className="surface-page min-h-screen pb-20 text-deep-charcoal transition-colors duration-200 dark:text-off-white">
         <header
          className={`surface-nav sticky top-0 z-30 flex items-center justify-between px-6 border-b transition-[transform,padding,box-shadow,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isHeaderCompact ? 'shadow-sm' : ''}`}
          style={{
            paddingTop: `calc(env(safe-area-inset-top, 0px) + ${isHeaderCompact ? '0.5rem' : '1.5rem'})`,
            paddingBottom: isHeaderCompact ? '0.5rem' : '0.75rem',
            transform: isHeaderHidden ? 'translateY(-100%)' : 'translateY(0)',
            opacity: isHeaderHidden ? 0.98 : 1,
            willChange: 'transform'
          }}
        >
          <div className={`flex items-center justify-start transition-all duration-300 ${isHeaderCompact ? 'w-9 h-9' : 'w-10 h-10'}`}>
            <button onClick={() => navigate(-1)} className="text-dark-grey transition-colors hover:text-deep-charcoal dark:text-gray-400 dark:hover:text-off-white">
              <span className={`material-symbols-outlined transition-all duration-300 ${isHeaderCompact ? 'text-[24px]' : 'text-[28px]'}`}>chevron_left</span>
            </button>
          </div>
          <h1 className={`font-bold tracking-tight text-deep-charcoal dark:text-off-white transition-all duration-300 ${isHeaderCompact ? 'text-base' : 'text-lg'}`}>{t('profile_account')}</h1>
          <div className={`flex items-center justify-end transition-all duration-300 ${isHeaderCompact ? 'gap-2' : 'gap-3'}`}>
            <button onClick={toggleDarkMode} className="text-primary hover:text-primary-alt transition-colors" title={isDarkMode ? t('profile_switch_to_light_mode') : t('profile_switch_to_dark_mode')}>
              <span className={`material-symbols-outlined transition-all duration-300 ${isHeaderCompact ? 'text-[20px]' : 'text-[24px]'}`}>
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <LanguageSwitcher />
          </div>
        </header>
        <Auth />
      </div>
    );
  }

  return (
    <div className="surface-page relative min-h-screen w-full pb-32 text-deep-charcoal transition-colors duration-200 dark:text-off-white">
        <header
          className={`surface-nav sticky top-0 z-30 flex items-center justify-between px-6 border-b transition-[transform,padding,box-shadow,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isHeaderCompact ? 'shadow-sm' : ''}`}
          style={{
            paddingTop: `calc(env(safe-area-inset-top, 0px) + ${isHeaderCompact ? '0.5rem' : '1.5rem'})`,
            paddingBottom: isHeaderCompact ? '0.5rem' : '0.75rem',
            transform: isHeaderHidden ? 'translateY(-100%)' : 'translateY(0)',
            opacity: isHeaderHidden ? 0.98 : 1,
            willChange: 'transform'
          }}
        >
          <div className={`flex items-center justify-start transition-all duration-300 ${isHeaderCompact ? 'w-9 h-9' : 'w-10 h-10'}`}>
            <button onClick={() => navigate(-1)} className="text-dark-grey transition-colors hover:text-deep-charcoal dark:text-gray-400 dark:hover:text-off-white">
              <span className={`material-symbols-outlined transition-all duration-300 ${isHeaderCompact ? 'text-[24px]' : 'text-[28px]'}`}>chevron_left</span>
            </button>
          </div>
          <h1 className={`font-bold tracking-tight text-deep-charcoal dark:text-off-white transition-all duration-300 ${isHeaderCompact ? 'text-base' : 'text-lg'}`}>{t('profile_my_profile')}</h1>
          <div className={`flex items-center justify-end transition-all duration-300 ${isHeaderCompact ? 'gap-2' : 'gap-3'}`}>
            <button onClick={toggleDarkMode} className="text-primary hover:text-primary-alt transition-colors" title={isDarkMode ? t('profile_switch_to_light_mode') : t('profile_switch_to_dark_mode')}>
              <span className={`material-symbols-outlined transition-all duration-300 ${isHeaderCompact ? 'text-[20px]' : 'text-[24px]'}`}>
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <LanguageSwitcher />
            <button onClick={signOut} className="text-primary hover:text-primary-alt transition-colors" title={t('profile_sign_out')}>
              <span className={`material-symbols-outlined transition-all duration-300 ${isHeaderCompact ? 'text-[20px]' : 'text-[24px]'}`}>logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-32 scrollbar-hide">
          <section className="flex flex-col items-center px-6 mt-2">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-primary/5 p-1 bg-white dark:bg-deep-charcoal transition-colors">
                <div className="w-full h-full rounded-full bg-cover bg-center overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-4xl text-gray-300 transition-colors">
                   {/* Placeholder avatar based on email first letter */}
                   {user.email?.[0].toUpperCase()}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full border-2 border-white dark:border-deep-charcoal shadow-md flex items-center gap-1 transition-colors">
                <span className="material-symbols-outlined text-[12px] fill-1">workspace_premium</span>
                {t('profile_member')}
              </div>
            </div>
            <div className="text-center mt-4">
              <h2 className="text-2xl font-bold text-deep-charcoal dark:text-off-white">{user.email?.split('@')[0]}</h2>
              <p className="text-primary text-sm font-medium mt-1">{user.email}</p>
            </div>
          </section>

          <section className="px-6 mt-8">
            <div className="persona-card rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
                <span className="text-xs font-bold text-primary tracking-widest uppercase">{t('profile_ai_persona')}</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-deep-charcoal dark:text-off-white">{t('profile_persona_title')}</h3>
              <p className="text-dark-grey text-sm leading-relaxed italic dark:text-gray-400">
                {t('profile_persona_desc')}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-white dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[78%]"></div>
                </div>
                <span className="text-[10px] font-bold text-dark-grey/50 dark:text-gray-500">78% {t('profile_sync')}</span>
              </div>
            </div>
          </section>

          <section className="px-6 mt-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-primary mb-2 text-[24px]">calendar_today</span>
                <span className="text-[10px] text-dark-grey font-semibold uppercase tracking-tighter dark:text-gray-400">{t('profile_consistency')}</span>
                <span className="text-lg font-bold text-deep-charcoal dark:text-off-white">92%</span>
              </div>
              <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-primary mb-2 text-[24px]">nutrition</span>
                <span className="text-[10px] text-dark-grey font-semibold uppercase tracking-tighter dark:text-gray-400">{t('profile_nutrients')}</span>
                <span className="text-lg font-bold text-deep-charcoal dark:text-off-white">{t('profile_high')}</span>
              </div>
              <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-primary mb-2 text-[24px]">favorite</span>
                <span className="text-[10px] text-dark-grey font-semibold uppercase tracking-tighter dark:text-gray-400">{t('profile_satisfaction')}</span>
                <span className="text-lg font-bold text-deep-charcoal dark:text-off-white">4.8</span>
              </div>
            </div>
          </section>

          <section className="mt-8 px-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-deep-charcoal dark:text-off-white">{t('profile_my_favorites')}</h3>
              <button className="text-primary text-xs font-bold">{t('profile_view_all')}</button>
            </div>
            <div className="space-y-4">
              {/* Static favorites for now */}
              <div className="flex items-center gap-4 recipe-card rounded-2xl p-3 shadow-sm">
                <div className="w-16 h-16 rounded-xl bg-cover bg-center flex-shrink-0" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBGy3egTY1CBsKJjhtGubzYlXXIHK0DJmsZ17iRRTeJ-BGkEOsZKUbTq7VtdN1my8c2RU2OY4r_XuTajeYkZcUbReUHgPCElP0Gi6tAa_cSa1ymVT5LRsq_feguep1B7a0NrtlXfD4C4WVasjOoMnkamQwmSiUytIyFH2jLlc6x3sUfsOVgcbwjK76vB0JKyNj21SnwiWvv1gYPCpxRXGndyQA6b7eBZmIfA1BL0vOxdrpy6iF5H8KSKaN-WK3qHLLooYI83djLF_Wq')" }}></div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm mb-1 truncate text-deep-charcoal dark:text-off-white">{t('recipe_baked_cod')}</p>
                  <div className="flex items-center gap-2 text-[10px] text-dark-grey/70 dark:text-gray-400">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">schedule</span> {t('recipe_time')}</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">local_fire_department</span> {t('recipe_high_protein')}</span>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-full flex items-center justify-center text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px] fill-1">bookmark</span>
                </button>
              </div>
            </div>
          </section>
        </main>

    </div>
  );
};

export default Profile;
