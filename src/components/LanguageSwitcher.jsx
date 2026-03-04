import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full p-1 border border-transparent dark:border-gray-700">
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-200 ${
          i18n.language === 'en' || i18n.language.startsWith('en')
            ? 'bg-white dark:bg-gray-600 text-primary shadow-sm scale-105'
            : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage('zh')}
        className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-200 ${
          i18n.language === 'zh' || i18n.language.startsWith('zh')
            ? 'bg-white dark:bg-gray-600 text-primary shadow-sm scale-105'
            : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
        }`}
      >
        中
      </button>
    </div>
  );
};

export default LanguageSwitcher;
