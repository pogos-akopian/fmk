import React, { useState, useEffect } from 'react';
import { TelegramProvider, useTelegram } from './utils/telegram';
import { translations } from './utils/translations';
import MainScreen from './screens/MainScreen';
import ChatListScreen from './screens/ChatListScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';

function AppContent() {
  const { webApp, user, initData } = useTelegram();
  const [screen, setScreen] = useState('main');
  const [userData, setUserData] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [language, setLanguage] = useState('ru');
  const [theme, setTheme] = useState('light');
  const [filmGrain, setFilmGrain] = useState(true);
  const [loading, setLoading] = useState(true);

  const t = (key) => translations[language]?.[key] || translations['ru'][key] || key;

  useEffect(() => {
    if (webApp) {
      webApp.ready();
      webApp.expand();
      webApp.enableClosingConfirmation();
      
      // Установка цветов темы
      if (theme === 'dark') {
        webApp.setHeaderColor('#050505');
        webApp.setBackgroundColor('#050505');
      } else {
        webApp.setHeaderColor('#FAF6EF');
        webApp.setBackgroundColor('#FAF6EF');
      }
    }
    
    if (initData) {
      login();
    } else {
      setLoading(false);
    }
  }, [initData]);

  useEffect(() => {
    if (userData) {
      setLanguage(userData.language || 'ru');
      setTheme(userData.theme || 'light');
      setFilmGrain(userData.film_grain !== 0);
    }
  }, [userData]);

  useEffect(() => {
    if (webApp) {
      if (theme === 'dark') {
        webApp.setHeaderColor('#050505');
        webApp.setBackgroundColor('#050505');
      } else {
        webApp.setHeaderColor('#FAF6EF');
        webApp.setBackgroundColor('#FAF6EF');
      }
    }
  }, [theme, webApp]);

  const login = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'X-Telegram-Init-Data': initData
        }
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      if (data.success) {
        setUserData(data.user);
      }
    } catch (error) {
      console.error('Login error:', error);
      if (webApp) {
        webApp.showAlert('Ошибка авторизации. Попробуйте перезапустить приложение.');
      }
    } finally {
      setLoading(false);
    }
  };

  const openChat = (chat) => {
    setCurrentChat(chat);
    setScreen('chat');
  };

  const goToScreen = (screenName) => {
    setScreen(screenName);
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-dark-bg text-white' : 'bg-light-bg text-black'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-accent mx-auto mb-4"></div>
          <p className="text-lg">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-dark-bg text-white' : 'bg-light-bg text-black'}`}>
        <div className="text-center p-6">
          <div className="text-6xl mb-4">💘</div>
          <h1 className="text-2xl font-bold mb-4">FMK Dating</h1>
          <p className="opacity-70">Не удалось загрузить данные пользователя</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-6 py-3 bg-accent text-white rounded-lg font-semibold"
          >
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-bg text-white' : 'bg-light-bg text-black'} ${filmGrain ? 'film-grain' : ''}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 flex justify-around border-b ${theme === 'dark' ? 'border-zinc-800 bg-dark-bg/80' : 'border-gray-200 bg-light-bg/80'} backdrop-blur-md p-3`}>
        <button 
          onClick={() => goToScreen('main')} 
          className={`px-4 py-2 rounded-lg transition ${screen === 'main' ? 'bg-accent text-white font-bold' : 'hover:bg-accent/10'}`}
        >
          {t('main')}
        </button>
        <button 
          onClick={() => goToScreen('chats')} 
          className={`px-4 py-2 rounded-lg transition ${screen === 'chats' ? 'bg-accent text-white font-bold' : 'hover:bg-accent/10'}`}
        >
          {t('chats')}
        </button>
        <button 
          onClick={() => goToScreen('profile')} 
          className={`px-4 py-2 rounded-lg transition ${screen === 'profile' ? 'bg-accent text-white font-bold' : 'hover:bg-accent/10'}`}
        >
          {t('profile')}
        </button>
        <button 
          onClick={() => goToScreen('settings')} 
          className={`px-4 py-2 rounded-lg transition ${screen === 'settings' ? 'bg-accent text-white font-bold' : 'hover:bg-accent/10'}`}
        >
          {t('settings')}
        </button>
      </nav>

      {/* Content */}
      <div className="pt-16 pb-6">
        {screen === 'main' && <MainScreen t={t} theme={theme} initData={initData} webApp={webApp} />}
        {screen === 'chats' && <ChatListScreen t={t} theme={theme} initData={initData} openChat={openChat} webApp={webApp} />}
        {screen === 'chat' && <ChatScreen t={t} theme={theme} initData={initData} chat={currentChat} goBack={() => goToScreen('chats')} webApp={webApp} />}
        {screen === 'profile' && <ProfileScreen t={t} theme={theme} initData={initData} userData={userData} setUserData={setUserData} webApp={webApp} />}
        {screen === 'settings' && <SettingsScreen t={t} theme={theme} initData={initData} userData={userData} setUserData={setUserData} language={language} setLanguage={setLanguage} currentTheme={theme} setTheme={setTheme} filmGrain={filmGrain} setFilmGrain={setFilmGrain} webApp={webApp} />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <TelegramProvider>
      <AppContent />
    </TelegramProvider>
  );
}