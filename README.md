# FMK Dating - Telegram Mini App

Современное дейтинг-приложение с механикой Fuck/Marry/Kill для Telegram.

## 🚀 Быстрый старт

### 1. Установка зависимостей
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Bot
cd ../bot
npm install
```

### 2. Настройка переменных окружения

#### backend/.env
```env
PORT=3000
BOT_TOKEN=your_telegram_bot_token_here
FRONTEND_URL=http://localhost:5173
DATABASE_PATH=./database.db
NODE_ENV=development
```

#### frontend/.env
```env
VITE_API_URL=http://localhost:3000
VITE_BOT_USERNAME=your_bot_username
```

#### bot/.env
```env
BOT_TOKEN=your_telegram_bot_token_here
WEBAPP_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

### 3. Создание бота в Telegram

1. Откройте @BotFather в Telegram
2. Отправьте `/newbot`
3. Следуйте инструкциям
4. Получите токен и добавьте в `.env` файлы
5. Настройте Mini App: `/newapp` → выберите бота → укажите URL

### 4. Запуск приложения
```bash
# Терминал 1 - Backend
cd backend
npm run dev

# Терминал 2 - Frontend
cd frontend
npm run dev

# Терминал 3 - Bot
cd bot
npm run dev
```