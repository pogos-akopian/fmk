import React, { useState, useEffect } from 'react';

export default function MainScreen({ t, theme, initData, webApp }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [showMatch, setShowMatch] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNextUser();
  }, []);

  const loadNextUser = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/next`, {
        headers: {
          'X-Telegram-Init-Data': initData
        }
      });
      const data = await response.json();
      setCurrentUser(data.user);
    } catch (error) {
      console.error('Load user error:', error);
      if (webApp) {
        webApp.showAlert('Ошибка загрузки пользователя');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    if (!currentUser || loading) return;

    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/action/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': initData
        },
        body: JSON.stringify({
          toUserId: currentUser.telegram_user_id,
          action
        })
      });
      
      const data = await response.json();
      
      if (data.matchType === 'instant') {
        setMatchData({ type: 'instant', action: data.action, icon: data.icon });
        setShowMatch(true);
        
        if (webApp) {
          webApp.HapticFeedback.notificationOccurred('success');
        }
        
        setTimeout(() => {
          setShowMatch(false);
          loadNextUser();
        }, 3000);
      } else if (data.matchType === 'conditional') {
        setMatchData({ type: 'conditional', icon: data.icon });
        setShowMatch(true);
        
        if (webApp) {
          webApp.HapticFeedback.notificationOccurred('success');
        }
        
        setTimeout(() => {
          setShowMatch(false);
          loadNextUser();
        }, 3000);
      } else {
        loadNextUser();
      }
    } catch (error) {
      console.error('Action error:', error);
      if (webApp) {
        webApp.showAlert('Ошибка отправки действия');
      }
      setLoading(false);
    }
  };

  if (showMatch) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)] p-4">
        <div className="text-center animate-pulse">
          <div className="text-8xl mb-6">
            {matchData?.icon || '💘'}
          </div>
          <h2 className="text-4xl font-bold text-accent mb-3">
            {matchData?.type === 'instant' ? t('instant_match') : t('match')}
          </h2>
          {matchData?.type === 'conditional' && (
            <p className="text-lg opacity-70">{t('potential_match')}</p>
          )}
        </div>
      </div>
    );
  }

  if (loading && !currentUser) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)] p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-accent mx-auto mb-4"></div>
          <p className="text-lg opacity-70">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)] p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-2xl font-bold mb-2">{t('no_more_users')}</p>
          <p className="text-sm opacity-70">Загляните позже!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
      {/* Profile Card */}
      <div className={`w-full max-w-md rounded-3xl overflow-hidden ${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'} shadow-2xl mb-8`}>
        <div className="relative h-[500px]">
          {currentUser.photos && currentUser.photos[0] ? (
            <img 
              src={currentUser.photos[0]} 
              alt={currentUser.first_name}
              className="w-full h-full object-cover photo-blur"
            />
          ) : (
            <div className="w-full h-full bg-accent/10 flex items-center justify-center">
              <span className="text-8xl">👤</span>
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/70 to-transparent"></div>
          
          {/* Name overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h2 className="text-3xl font-bold drop-shadow-lg">{currentUser.first_name}</h2>
            {currentUser.description && (
              <p className="mt-2 text-sm opacity-90 drop-shadow-md line-clamp-2">{currentUser.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center items-center gap-6 w-full max-w-md">
        <button
          onClick={() => handleAction('kill')}
          disabled={loading}
          className={`w-20 h-20 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-sm font-bold hover:bg-red-500/30 active:scale-95 transition-all shadow-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {t('kill')}
        </button>
        
        <button
          onClick={() => handleAction('marry')}
          disabled={loading}
          className={`w-24 h-24 rounded-full bg-accent/20 text-accent flex items-center justify-center text-base font-bold hover:bg-accent/30 active:scale-95 transition-all shadow-xl ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {t('marry')}
        </button>
        
        <button
          onClick={() => handleAction('fuck')}
          disabled={loading}
          className={`w-20 h-20 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-sm font-bold hover:bg-orange-500/30 active:scale-95 transition-all shadow-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {t('fuck')}
        </button>
      </div>
    </div>
  );
}