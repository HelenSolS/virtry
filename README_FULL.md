# 🎨 Virtual Try-On - Виртуальная примерочная

Полноценное web-приложение для виртуальной примерки одежды с использованием AI.

## 🌐 Доступные версии

### 1️⃣ **Cloudflare Pages** (текущая production версия)
- **URL**: https://webapp.pages.dev
- **GitHub**: https://github.com/HelenSolS/virtry
- **Технологии**: Hono + Cloudflare Workers + AI Gateway
- **Статус**: ✅ Работает

### 2️⃣ **Vercel** (новая версия для вашего аккаунта)
- **Деплой**: [Инструкции ниже](#vercel-deployment)
- **Технологии**: Vercel Edge Functions + AI Gateway
- **Статус**: 🚀 Готов к деплою

## 🚀 Vercel Deployment

### Шаг 1: Настройка Cloudflare AI Gateway

1. Зайдите в [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Перейдите в **AI → AI Gateway**
3. Создайте новый Gateway с именем `virtry-gateway`
4. Скопируйте Gateway URL:
   ```
   https://gateway.ai.cloudflare.com/v1/{account_id}/virtry-gateway/google-ai-studio/v1beta/models/gemini-2.5-flash-image:generateContent
   ```
5. Создайте API Token в **AI → Manage** с правами **AI:Read** и **AI:Edit**

### Шаг 2: Деплой на Vercel

#### Вариант A: Через Vercel Dashboard (рекомендуется)

1. Зайдите на [Vercel](https://vercel.com)
2. Нажмите **Add New → Project**
3. **Import Git Repository**:
   - Выберите GitHub
   - Найдите репозиторий `HelenSolS/virtry`
   - Или укажите: `https://github.com/HelenSolS/virtry`
4. **Configure Project**:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Environment Variables** (добавьте ДВЕ переменные):
   ```
   GATEWAY_URL=https://gateway.ai.cloudflare.com/v1/{account_id}/virtry-gateway/google-ai-studio/v1beta/models/gemini-2.5-flash-image:generateContent
   GATEWAY_TOKEN=cf_xxxxxxxxxxxxx
   ```
6. Нажмите **Deploy**
7. Готово! Ваш сайт доступен по адресу `https://your-project.vercel.app`

#### Вариант B: Через Vercel CLI

```bash
# 1. Установите Vercel CLI
npm install -g vercel

# 2. Войдите в аккаунт
vercel login

# 3. Перейдите в проект
cd /home/user/webapp

# 4. Деплой
vercel --prod

# 5. Настройте переменные окружения через dashboard
```

### Шаг 3: Проверка

1. Откройте ваш Vercel URL
2. Загрузите фото человека
3. Загрузите фото одежды
4. Нажмите "Создать образ"
5. Дождитесь результата

## 📁 Структура проекта

```
webapp/
├── api/
│   └── tryon.js          # Vercel Edge Function (API endpoint)
├── dist/
│   ├── index.html        # Главная страница
│   └── static/
│       ├── app.js        # Frontend JavaScript
│       └── style.css     # CSS стили
├── src/                  # Cloudflare Workers версия
│   ├── index.tsx         # Hono backend
│   └── renderer.tsx      # SSR renderer
├── public/
│   └── static/           # Статические файлы
├── vercel.json           # Конфигурация Vercel
├── wrangler.jsonc        # Конфигурация Cloudflare
├── package.json
└── README.md
```

## 🛠️ Технологии

### Frontend
- **HTML/CSS/JavaScript** (Vanilla)
- **Responsive Design** с анимациями
- **Drag & Drop** загрузка изображений
- **Real-time preview**

### Backend

#### Cloudflare Pages (production):
- **Hono** - легковесный web framework
- **Cloudflare Workers** - edge runtime
- **Cloudflare AI Gateway** - кэширование и security

#### Vercel Edge Functions (новая версия):
- **Vercel Edge Runtime** - глобальный edge deployment
- **Cloudflare AI Gateway** - та же архитектура
- **2-step AI approach** - точная генерация

### AI
- **Google Gemini 2.5 Flash IMAGE** (Nano Banana)
- **2-step approach**:
  1. Step 1: AI описывает одежду (PHOTO B) → JSON
  2. Step 2: AI применяет одежду на человека (PHOTO A) с описанием
- **Comprehensive error handling**

## 🌟 Особенности

✅ **2-step AI подход** (как в архитектуре из видео)  
✅ **JSON описание одежды** для точности  
✅ **Cloudflare AI Gateway** для безопасности и кэширования  
✅ **Edge deployment** на Cloudflare или Vercel  
✅ **Comprehensive error handling**:
  - Обнаружение идентичных изображений
  - Safety filters
  - Понятные сообщения пользователям
  - Автоматические подсказки  
✅ **Красивый UI** с анимациями  
✅ **Responsive design**  
✅ **Drag & Drop** загрузка

## 🔒 Безопасность

- **API ключи хранятся только на сервере** (Environment Variables)
- **Клиенты никогда не видят токены**
- **Все запросы проходят через Gateway**
- **Rate limiting** и мониторинг
- **CORS** настроен правильно

## 📊 Лимиты и стоимость

### Google Gemini API (бесплатный тариф)
- **15 RPM** (requests per minute)
- **1,500 RPD** (requests per day)
- **Цена**: $0 в пределах лимита

### Cloudflare Pages (бесплатный тариф)
- **100,000 запросов/день**
- **10ms CPU** на запрос
- **Безлимитные проекты**

### Vercel (бесплатный тариф)
- **100GB bandwidth/месяц**
- **Безлимитные запросы**
- **Глобальный edge network**

**💰 Итого**: $0/мес для начала, ~100-200 пользователей/день

## 📚 Документация

- [GATEWAY_SETUP.md](./GATEWAY_SETUP.md) - Настройка Cloudflare AI Gateway
- [GATEWAY_MIGRATION.md](./GATEWAY_MIGRATION.md) - Миграция на Gateway
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Подробная инструкция по Vercel
- [ERROR_HANDLING.md](./ERROR_HANDLING.md) - Обработка ошибок
- [FAQ.md](./FAQ.md) - Часто задаваемые вопросы
- [HOSTING_GUIDE.md](./HOSTING_GUIDE.md) - Гайд по хостингу и монетизации

## 🐛 Troubleshooting

### Gateway errors
**Проблема**: `Gateway не настроен`  
**Решение**: Проверьте GATEWAY_URL и GATEWAY_TOKEN в Environment Variables

### Изображения не генерируются
**Проблема**: `Не удалось сгенерировать результат`  
**Решение**: 
- Проверьте размер изображений (до 2MB)
- Убедитесь, что формат JPG, PNG или WebP
- Проверьте лимиты API (15 RPM)

### AI возвращает то же изображение
**Проблема**: `Результат идентичен входному изображению`  
**Решение**:
- Используйте качественные фото с хорошим освещением
- Убедитесь, что одежда четко видна
- Попробуйте другие изображения

### 500 Internal Server Error (Vercel)
**Решение**:
1. Откройте [Vercel Dashboard](https://vercel.com/dashboard)
2. **Deployments** → выберите последний деплой
3. **Functions** → посмотрите логи
4. Проверьте переменные окружения

## 🚀 Следующие шаги

После успешного деплоя:

### 1. Тестирование
- [ ] Загрузить тестовые изображения
- [ ] Проверить все сценарии ошибок
- [ ] Протестировать на mobile

### 2. Мониторинг
- [ ] Настроить Vercel Analytics
- [ ] Подключить Google Analytics
- [ ] Мониторить Gateway usage

### 3. Улучшения
- [ ] Добавить hero video (заменить заглушку)
- [ ] История примерок (Cloudflare D1)
- [ ] Скачивание результатов
- [ ] Галерея примеров

### 4. Масштабирование
- [ ] Custom domain
- [ ] Rate limiting
- [ ] CDN optimization
- [ ] PWA support

### 5. Монетизация
- [ ] Freemium модель (3 генерации/день бесплатно)
- [ ] Premium подписка ($9.99/мес)
- [ ] B2B API access ($49-499/мес)

## 📞 Поддержка

- **GitHub Issues**: https://github.com/HelenSolS/virtry/issues
- **Документация**: [docs/](./docs/)
- **Email**: support@example.com

## 📄 Лицензия

MIT License - используйте свободно!

---

## 🎯 Быстрый старт для Vercel

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/HelenSolS/virtry.git
cd virtry

# 2. Установите зависимости
npm install

# 3. Настройте Gateway (см. GATEWAY_SETUP.md)

# 4. Деплой на Vercel
vercel --prod

# 5. Настройте Environment Variables в Vercel Dashboard:
# GATEWAY_URL=https://gateway.ai.cloudflare.com/v1/...
# GATEWAY_TOKEN=cf_xxxxxxxxxxxxx

# 6. Готово! 🎉
```

---

🎉 **Ваш Virtual Try-On готов к использованию!**

**Production URL (Cloudflare)**: https://webapp.pages.dev  
**GitHub**: https://github.com/HelenSolS/virtry  
**Sandbox**: https://3000-itu1vmgm2d8hm7r2pkot1-0e616f0a.sandbox.novita.ai

Теперь можете деплоить на свой Vercel аккаунт! 🚀
