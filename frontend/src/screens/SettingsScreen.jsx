import React from 'react';

export default function SettingsScreen({ 
  t, 
  theme, 
  initData, 
  userData, 
  setUserData, 
  language, 
  setLanguage, 
  currentTheme, 
  setTheme, 
  filmGrain, 
  setFilmGrain,
  webApp 
}) {
  
  const updateSettings = async (updates) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': initData
        },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      if (data.success) {
        setUserData(data.user);
        
        if (webApp) {
          webApp.HapticFeedback.impactOccurred('light');
        }
      }
    } catch (error) {
      console.error('Update settings error:', error);
      if (webApp) {
        webApp.showAlert('Ошибка сохранения настроек');
      }
    }
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    updateSettings({ language: lang });
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    updateSettings({ theme: newTheme });
  };

  const handleFilmGrainToggle = () => {
    const newValue = !filmGrain;
    setFilmGrain(newValue);
    updateSettings({ film_grain: newValue });
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-8">{t('settings')}</h2>

      {/* Language Settings */}
      <div className={`p-5 rounded-2xl mb-5 ${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'} shadow-lg`}>
        <p className="font-semibold text-lg mb-4">{t('language')}</p>
        <div className="flex gap-3">
          {[
            { code: 'ru', label: 'Русский' },
            { code: 'en', label: 'English' },
            { code: 'ar', label: 'العربية' }
          ].map(lang => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition active:scale-95 ${
                language === lang.code 
                  ? 'bg-accent text-white shadow-md' 
                  : theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme Settings */}
      <div className={`p-5 rounded-2xl mb-5 ${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'} shadow-lg`}>
        <p className="font-semibold text-lg mb-4">{t('theme')}</p>
        <div className="flex gap-3">
          <button
            onClick={() => handleThemeChange('light')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition active:scale-95 ${
              currentTheme === 'light' 
                ? 'bg-accent text-white shadow-md' 
                : theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            ☀️ {t('light')}
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition active:scale-95 ${
              currentTheme === 'dark' 
                ? 'bg-accent text-white shadow-md' 
                : theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            🌙 {t('dark')}
          </button>
        </div>
      </div>

      {/* Film Grain Toggle */}
      <div className={`p-5 rounded-2xl ${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'} shadow-lg`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-lg">{t('film_grain')}</p>
            <p className="text-sm opacity-70 mt-1">Винтажный эффект зерна</p>
          </div>
          <button
            onClick={handleFilmGrainToggle}
            className={`relative w-16 h-9 rounded-full transition-all ${
              filmGrain ? 'bg-accent' : theme === 'dark' ? 'bg-zinc-700' : 'bg-gray-300'
            }`}
          >
            <div className={`absolute top-1 w-7 h-7 rounded-full bg-white shadow-md transition-transform ${
              filmGrain ? 'translate-x-8' : 'translate-x-1'
            }`}></div>
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className={`mt-8 p-5 rounded-2xl ${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'} shadow-lg`}>
        <p className="text-sm opacity-70 text-center">FMK Dating v1.0</p>
        <p className="text-xs opacity-50 text-center mt-2">Made with 💘</p>
      </div>
    </div>
  );
}