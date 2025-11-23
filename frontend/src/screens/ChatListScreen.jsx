import React, { useState, useEffect } from 'react';

export default function ChatListScreen({ t, theme, initData, openChat, webApp }) {
  const [matches, setMatches] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadMatches(), loadPending()]);
    setLoading(false);
  };

  const loadMatches = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/match/list`, {
        headers: {
          'X-Telegram-Init-Data': initData
        }
      });
      const data = await response.json();
      setMatches(data.matches || []);
    } catch (error) {
      console.error('Load matches error:', error);
    }
  };

  const loadPending = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/match/pending`, {
        headers: {
          'X-Telegram-Init-Data': initData
        }
      });
      const data = await response.json();
      setPending(data.pending || []);
    } catch (error) {
      console.error('Load pending error:', error);
    }
  };

  const confirmMatch = async (matchId) => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/match/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': initData
        },
        body: JSON.stringify({ matchId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (webApp) {
          webApp.showAlert(data.message || t('confirmed'));
          webApp.HapticFeedback.notificationOccurred('success');
        }
        loadData();
      }
    } catch (error) {
      console.error('Confirm error:', error);
      if (webApp) {
        webApp.showAlert('Ошибка подтверждения');
      }
    }
  };

  const declineMatch = async (matchId) => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
    }

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/match/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': initData
        },
        body: JSON.stringify({ matchId })
      });
      
      loadData();
    } catch (error) {
      console.error('Decline error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)] p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Pending Matches */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-accent">{t('pending_matches')}</h2>
          {pending.map(p => (
            <div key={p.id} className={`p-4 rounded-2xl mb-3 ${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'} shadow-lg`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-14 h-14 rounded-full bg-accent/20 mr-4 flex items-center justify-center overflow-hidden">
                    {p.partnerPhotos && p.partnerPhotos[0] ? (
                      <img src={p.partnerPhotos[0]} alt="" className="w-full h-full object-cover photo-blur" />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{p.partnerName}</p>
                    <p className="text-sm opacity-70">
                      {p.myConfirmed ? t('waiting') + '...' : t('potential_match')}
                    </p>
                  </div>
                </div>
                {!p.myConfirmed && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => confirmMatch(p.id)}
                      className="px-4 py-2 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 active:scale-95 transition"
                    >
                      {t('confirm')}
                    </button>
                    <button
                      onClick={() => declineMatch(p.id)}
                      className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg font-semibold hover:bg-red-500/30 active:scale-95 transition"
                    >
                      {t('decline')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Matches */}
      <h2 className="text-xl font-bold mb-4">{t('active_chats')}</h2>
      
      {matches.length === 0 && pending.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-xl opacity-70">{t('no_matches')}</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-8">
          <p className="opacity-70">{t('no_matches')}</p>
        </div>
      ) : (
        matches.map(match => (
          <button
            key={match.id}
            onClick={() => {
              if (webApp) {
                webApp.HapticFeedback.impactOccurred('light');
              }
              openChat(match);
            }}
            className={`w-full p-4 rounded-2xl mb-3 ${theme === 'dark' ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-white hover:bg-gray-50'} transition text-left shadow-lg active:scale-98`}
          >
            <div className="flex items-center">
              <div className="w-14 h-14 rounded-full bg-accent/20 mr-4 flex items-center justify-center overflow-hidden">
                {match.partnerPhotos && match.partnerPhotos[0] ? (
                  <img src={match.partnerPhotos[0]} alt="" className="w-full h-full object-cover photo-blur" />
                ) : (
                  <span className="text-2xl">👤</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg">{match.partnerName}</p>
                <p className="text-sm opacity-70">
                  {match.type === 'instant' ? '💍 ' : '💬 '}{match.type === 'instant' ? t('instant_match') : t('potential_match')}
                </p>
              </div>
              <div className="text-2xl">→</div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}