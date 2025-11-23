import React, { createContext, useContext, useEffect, useState } from 'react';

const TelegramContext = createContext({});

export const TelegramProvider = ({ children }) => {
  const [webApp, setWebApp] = useState(null);
  const [user, setUser] = useState(null);
  const [initData, setInitData] = useState('');

  useEffect(() => {
    const app = window.Telegram?.WebApp;
    if (app) {
      setWebApp(app);
      setUser(app.initDataUnsafe?.user);
      setInitData(app.initData);
      
      app.ready();
      app.expand();
      
      console.log('Telegram WebApp initialized:', {
        version: app.version,
        platform: app.platform,
        userId: app.initDataUnsafe?.user?.id
      });
    } else {
      console.warn('Telegram WebApp not available');
    }
  }, []);

  return (
    <TelegramContext.Provider value={{ webApp, user, initData }}>
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => useContext(TelegramContext);