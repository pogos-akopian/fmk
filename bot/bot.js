import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://your-app.com';

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, '💘 Добро пожаловать в FMK Dating!', {
    reply_markup: {
      inline_keyboard: [[
        {
          text: '🚀 Открыть приложение',
          web_app: { url: WEBAPP_URL }
        }
      ]]
    }
  });
});

// Обработка фото для профиля
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const photo = msg.photo[msg.photo.length - 1];
  
  try {
    const fileLink = await bot.getFileLink(photo.file_id);
    
    // Отправляем URL фото в backend
    await axios.post(`${process.env.BACKEND_URL}/api/user/add-photo`, {
      telegram_user_id: msg.from.id,
      photo_url: fileLink
    });
    
    bot.sendMessage(chatId, '✅ Фото добавлено в профиль!');
  } catch (error) {
    console.error('Photo upload error:', error);
    bot.sendMessage(chatId, '❌ Ошибка при добавлении фото');
  }
});

// Обработка аудио
bot.on('voice', async (msg) => {
  const chatId = msg.chat.id;
  const voice = msg.voice;
  
  if (voice.file_size > 10 * 1024 * 1024) {
    bot.sendMessage(chatId, '❌ Файл слишком большой (макс. 10 МБ)');
    return;
  }
  
  try {
    const fileLink = await bot.getFileLink(voice.file_id);
    bot.sendMessage(chatId, '✅ Аудио обработано!');
  } catch (error) {
    console.error('Voice upload error:', error);
  }
});

console.log('🤖 FMK Dating Bot запущен...');