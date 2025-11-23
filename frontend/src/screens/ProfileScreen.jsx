import React, { useState } from 'react';

export default function ProfileScreen({ t, theme, initData, userData, setUserData, webApp }) {
  const [description, setDescription] = useState(userData.description || '');
  const [photos, setPhotos] = useState(userData.photos || []);
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': initData
        },
        body: JSON.stringify({ description, photos })
      });
      
      const data = await response.json();
      if (data.success) {
        setUserData(data.user);
        
        if (webApp) {
          webApp.showAlert(t('save') + ' ✓');
          webApp.HapticFeedback.notificationOccurred('success');
        }
      }
    } catch (error) {
      console.error('Save profile error:', error);
      if (webApp) {
        webApp.showAlert('Ошибка сохранения профиля');
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = () => {
    if (webApp) {
      webApp.showAlert('Для добавления фото отправьте их боту @' + import.meta.env.VITE_BOT_USERNAME);
    }
  };

  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto pb-20">
      <h2 className="text-3xl font-bold mb-6">{t('profile')}</h2>
      
      {/* Photos Section */}
      <div className="mb-8">
        <label className="block mb-3 font-semibold text-lg">{t('add_photo')}</label>
        <p className="text-sm opacity-70 mb-4">Максимум 5 фото</p>
        
        <div className="grid grid-cols-3 gap-3">
          {photos.map((photo, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-accent/10 group">
              <img 
                src={photo} 
                alt={`Photo ${idx + 1}`} 
                className="w-full h-full object-cover photo-blur group-hover:photo-unblur transition-all" 
              />
              <button
                onClick={() => removePhoto(idx)}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:scale-110"
              >
                ×
              </button>
            </div>
          ))}
          
          {photos.length < 5 && (
            <button 
              onClick={handlePhotoUpload}
              className={`aspect-square rounded-xl ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-200 hover:bg-gray-300'} flex items-center justify-center text-4xl transition active:scale-95`}
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* Description Section */}
      <div className="mb-8">
        <label className="block mb-3 font-semibold text-lg">{t('description')}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 300))}
          maxLength={300}
          rows={5}
          className={`w-full px-4 py-3 rounded-xl ${
            theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100'
          } outline-none focus:ring-2 focus:ring-accent resize-none`}
          placeholder={t('description') + '...'}
        />
        <p className="text-sm opacity-70 mt-2 text-right">{description.length}/300</p>
      </div>

      {/* Save Button */}
      <button
        onClick={saveProfile}
        disabled={saving}
        className={`w-full py-4 bg-accent text-white rounded-xl font-bold text-lg hover:bg-accent/90 active:scale-98 transition shadow-lg ${
          saving ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {saving ? t('loading') : t('save')}
      </button>
      
      {/* Profile Info */}
      <div className={`mt-6 p-4 rounded-xl ${theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100'}`}>
        <p className="text-sm opacity-70 mb-2">ID: {userData.telegram_user_id}</p>
        <p className="text-sm opacity-70">Username: @{userData.username || 'не указан'}</p>
      </div>
    </div>
  );
}