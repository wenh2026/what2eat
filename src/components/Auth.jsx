import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { logEvent, logError } from '../lib/logger';

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const { hydrateFromSupabase } = useUserStore();
  const redirectTo = location.state?.from || '/history';
  const resolveAuthErrorMessage = (error) => {
    if (error?.code === 'invalid_credentials' || error?.code === 'invalid_grant') {
      return t('auth_invalid_credentials');
    }
    if (error?.code === 'over_email_send_rate_limit') {
      return t('auth_rate_limited');
    }
    return error?.message || t('auth_generic_failed');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('error');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        logEvent('auth_sign_up_success', { scene: 'auth_form', status: 'success', email });
        setMessage(t('auth_sign_up_success'));
        setMessageType('success');
        setPassword('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        const hydrateResult = await hydrateFromSupabase();
        if (!hydrateResult?.ok) {
          setMessage(t('auth_sync_failed'));
          setMessageType('error');
          logEvent('auth_sign_in_fail', {
            scene: 'auth_form',
            status: 'fail',
            email,
            error_code: hydrateResult?.errorCode || 'HYDRATE_FAILED',
          });
          return;
        }
        logEvent('auth_sign_in_success', { scene: 'auth_form', status: 'success', email });
        navigate(redirectTo, { replace: true });
      }
    } catch (error) {
      logError('auth_sign_in_fail', error, { scene: 'auth_form', status: 'fail', email, error_code: error?.code || 'AUTH_FAILED' });
      setMessage(resolveAuthErrorMessage(error));
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-deep-charcoal transition-colors duration-200 dark:text-off-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/10 mb-4">
            <span className="material-symbols-outlined text-3xl text-primary">lock</span>
          </div>
          <h2 className="text-2xl font-bold text-deep-charcoal dark:text-off-white">
            {isSignUp ? t('auth_create_account') : t('auth_welcome_back')}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {isSignUp 
              ? t('auth_sign_up_subtitle') 
              : t('auth_sign_in_subtitle')}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('auth_email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-deep-charcoal outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-deep-charcoal dark:text-off-white"
              placeholder={t('auth_email_placeholder')}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('auth_password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-deep-charcoal outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-deep-charcoal dark:text-off-white"
              placeholder="••••••••"
              required
            />
          </div>

          {message && (
            <div className={`rounded-xl p-3 text-sm ${messageType === 'success' ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
            <span>{isSignUp ? t('auth_sign_up') : t('auth_sign_in')}</span>
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage('');
            }}
            className="text-sm font-medium text-gray-500 transition-colors hover:text-primary dark:text-gray-400"
          >
            {isSignUp ? t('auth_has_account') : t('auth_no_account')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
