# 🔒 ЗАЩИЩЕННАЯ БАЗА MVP - НЕ ТРОГАТЬ!

## ✅ ЧТО РАБОТАЕТ И НЕ ДОЛЖНО ЛОМАТЬСЯ

### 🛡️ CORE ФУНКЦИОНАЛ (НЕПРИКОСНОВЕННЫЙ)

```
1. Загрузка фото пользователя
2. Загрузка фото одежды  
3. Генерация примерки (gemini-2.5-flash + gemini-2.5-flash-image)
4. Получение итогового изображения
5. Отображение результата
```

### 🔒 ЗАЩИЩЕННЫЕ ФАЙЛЫ (НЕ ИЗМЕНЯТЬ)

```
api/
├── describe.js         ← CORE: Анализ одежды
└── generate.js         ← CORE: Генерация Try-On

public/static/
├── app.js              ← CORE: Frontend логика
└── style.css           ← CORE: Стили

public/
└── index.html          ← CORE: Главная страница

.dev.vars               ← CORE: Environment
dev-server.mjs          ← CORE: Dev сервер
ecosystem.dev.config.cjs ← CORE: PM2 конфигурация
```

---

## 📋 НОВЫЕ МОДУЛИ (ТЗ ОТ ПОЛЬЗОВАТЕЛЯ)

### 0️⃣ БАЗОВОЕ ПРАВИЛО
- ✅ Ничего не ломаем в текущем MVP
- ✅ Все доработки модульно
- ✅ Флаги включения/выключения фич
- ✅ Удобное тестирование

---

### 1️⃣ ПОЛЬЗОВАТЕЛЬ И АВТОРИЗАЦИЯ

**Новые файлы** (НЕ ТРОГАЮТ БАЗУ):
```
api/
└── user/
    ├── create.js           ← POST /api/user/create
    ├── get.js              ← GET /api/user/me
    └── update.js           ← PATCH /api/user/me

migrations/
└── 0001_users.sql          ← CREATE TABLE users

public/static/
└── auth-module.js          ← Модуль авторизации
```

**Схема БД**:
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL, -- 'telegram' | 'web'
  terms_accepted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Интеграция**:
- Telegram Mini App: `telegram_id` → `external_id`
- Web: Magic link / OAuth → `external_id`

---

### 2️⃣ ЮРИДИЧЕСКИЙ БЛОК

**Новые файлы**:
```
api/
└── terms/
    ├── accept.js           ← POST /api/terms/accept
    └── status.js           ← GET /api/terms/status

public/
└── terms.html              ← Страница с офертой
└── privacy.html            ← Политика конфиденциальности

public/static/
└── terms-modal.js          ← Модаль с чекбоксом
```

**Логика**:
- Перед первой генерацией → показать модаль с чекбоксом
- При согласии → `POST /api/terms/accept`
- Backend проверяет `terms_accepted_at != null`
- Если нет → ошибка `terms_not_accepted`

---

### 3️⃣ ПОДПИСКА «МАГИЯ»

**Новые файлы**:
```
api/
└── subscription/
    ├── status.js           ← GET /api/subscription/status
    ├── create.js           ← POST /api/subscription/create
    └── webhook.js          ← POST /api/subscription/webhook

migrations/
└── 0002_subscriptions.sql  ← CREATE TABLE subscriptions

public/static/
└── subscription-module.js  ← Модуль подписки
```

**Схема БД**:
```sql
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan TEXT NOT NULL, -- 'magic_basic'
  status TEXT NOT NULL, -- 'active' | 'expired' | 'canceled'
  started_at DATETIME,
  expired_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Логика**:
- Базовая примерка + скачивание → БЕСПЛАТНО
- Подписка «Магия» → пресеты видео + расширенная история

---

### 4️⃣ КНОПКА «МАГИЯ» И PAYWALL

**Новые файлы**:
```
public/static/
├── magic-button.js         ← Кнопка "Магия" на результате
└── paywall-modal.js        ← Экран paywall
```

**Логика**:
```
1. Результат готов → показать кнопку "Магия"
2. Клик → запрос GET /api/subscription/status
3. Если status != 'active' → показать paywall
4. После оплаты → открыть экран "Магии"
```

---

### 5️⃣ «МАГИЯ»: ПРЕСЕТЫ ДЛЯ ВИДЕО

**Новые файлы**:
```
api/
└── magic/
    ├── video-create.js     ← POST /api/magic/video
    └── video-status.js     ← GET /api/magic/video/:task_id

migrations/
└── 0003_magic_tasks.sql    ← CREATE TABLE magic_tasks

public/
└── magic.html              ← Страница "Магия"

public/static/
└── magic-presets.js        ← Модуль пресетов
```

**Схема БД**:
```sql
CREATE TABLE magic_tasks (
  id TEXT PRIMARY KEY, -- task_id (UUID)
  user_id INTEGER NOT NULL,
  fitting_id INTEGER,
  preset_type TEXT NOT NULL,
  status TEXT NOT NULL, -- 'pending' | 'processing' | 'completed' | 'failed'
  video_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (fitting_id) REFERENCES fittings(id)
);
```

---

### 6️⃣ ИСТОРИЯ ПРИМЕРОК

**Новые файлы**:
```
api/
└── fittings/
    ├── list.js             ← GET /api/fittings?limit=...
    ├── get.js              ← GET /api/fittings/:id
    └── delete.js           ← DELETE /api/fittings/:id

migrations/
└── 0004_fittings.sql       ← CREATE TABLE fittings

public/
└── history.html            ← Страница истории

public/static/
└── history-module.js       ← Модуль истории
```

**Схема БД**:
```sql
CREATE TABLE fittings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  input_image_url TEXT NOT NULL,
  outfit_image_url TEXT NOT NULL,
  result_image_url TEXT NOT NULL,
  description_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Логика**:
- Базово → последние 5 примерок (все пользователи)
- Подписка «Магия» → расширенная история (все примерки)

---

### 7️⃣ ФИЧЕ-ФЛАГИ

**Новый файл**:
```
.dev.vars (дополнение):
FEATURE_MAGIC_ENABLED=false
FEATURE_SUBSCRIPTION_ENABLED=false
FEATURE_HISTORY_ENABLED=false
FEATURE_TERMS_ENABLED=true
```

**Применение**:
```javascript
// В каждом новом модуле
if (process.env.FEATURE_MAGIC_ENABLED !== 'true') {
  return new Response(
    JSON.stringify({ error: 'Feature disabled' }), 
    { status: 503 }
  );
}
```

---

## 🗂️ ФИНАЛЬНАЯ СТРУКТУРА ПРОЕКТА

```
webapp/
├── api/
│   ├── describe.js         ← 🔒 CORE (НЕ ТРОГАТЬ)
│   ├── generate.js         ← 🔒 CORE (НЕ ТРОГАТЬ)
│   ├── user/               ← ✅ НОВЫЙ МОДУЛЬ
│   │   ├── create.js
│   │   ├── get.js
│   │   └── update.js
│   ├── terms/              ← ✅ НОВЫЙ МОДУЛЬ
│   │   ├── accept.js
│   │   └── status.js
│   ├── subscription/       ← ✅ НОВЫЙ МОДУЛЬ
│   │   ├── status.js
│   │   ├── create.js
│   │   └── webhook.js
│   ├── magic/              ← ✅ НОВЫЙ МОДУЛЬ
│   │   ├── video-create.js
│   │   └── video-status.js
│   └── fittings/           ← ✅ НОВЫЙ МОДУЛЬ
│       ├── list.js
│       ├── get.js
│       └── delete.js
├── migrations/             ← ✅ НОВАЯ ПАПКА
│   ├── 0001_users.sql
│   ├── 0002_subscriptions.sql
│   ├── 0003_magic_tasks.sql
│   └── 0004_fittings.sql
├── public/
│   ├── index.html          ← 🔒 CORE (НЕ ТРОГАТЬ)
│   ├── terms.html          ← ✅ НОВАЯ СТРАНИЦА
│   ├── privacy.html        ← ✅ НОВАЯ СТРАНИЦА
│   ├── magic.html          ← ✅ НОВАЯ СТРАНИЦА
│   ├── history.html        ← ✅ НОВАЯ СТРАНИЦА
│   └── static/
│       ├── app.js          ← 🔒 CORE (НЕ ТРОГАТЬ)
│       ├── style.css       ← 🔒 CORE (НЕ ТРОГАТЬ)
│       ├── auth-module.js  ← ✅ НОВЫЙ МОДУЛЬ
│       ├── terms-modal.js  ← ✅ НОВЫЙ МОДУЛЬ
│       ├── subscription-module.js ← ✅ НОВЫЙ МОДУЛЬ
│       ├── magic-button.js ← ✅ НОВЫЙ МОДУЛЬ
│       ├── paywall-modal.js ← ✅ НОВЫЙ МОДУЛЬ
│       ├── magic-presets.js ← ✅ НОВЫЙ МОДУЛЬ
│       └── history-module.js ← ✅ НОВЫЙ МОДУЛЬ
├── .dev.vars               ← 🔒 CORE + новые флаги
├── wrangler.jsonc          ← Добавить D1 binding
└── MVP_GOLDEN_VERSION.md   ← 🔒 ЭТАЛОН
```

---

## 🎯 ПЛАН РЕАЛИЗАЦИИ (ПОШАГОВО)

### Этап 1: База данных (D1)
1. Создать D1 базу в Cloudflare
2. Написать миграции (users, subscriptions, magic_tasks, fittings)
3. Применить миграции локально и на продакшене

### Этап 2: Авторизация
1. `api/user/*` endpoints
2. `auth-module.js` (Telegram Mini App + Web)
3. Middleware для проверки user_id

### Этап 3: Юридический блок
1. `terms.html`, `privacy.html`
2. `api/terms/*` endpoints
3. `terms-modal.js` (чекбокс при первой генерации)
4. Проверка `terms_accepted_at` в `api/generate.js`

### Этап 4: Подписка
1. `api/subscription/*` endpoints
2. Интеграция платежки (Stripe/Paddle)
3. `subscription-module.js`
4. Webhook обработчик

### Этап 5: Кнопка «Магия»
1. `magic-button.js` (показывается после результата)
2. `paywall-modal.js` (если нет подписки)
3. Проверка статуса подписки

### Этап 6: Пресеты видео
1. `api/magic/*` endpoints
2. `magic.html` страница
3. `magic-presets.js` (выбор пресета)
4. Интеграция видео генерации (Runway/Kling через Fal.ai?)

### Этап 7: История
1. `api/fittings/*` endpoints
2. `history.html` страница
3. `history-module.js` (список примерок)
4. Сохранение fitting при генерации

---

## ✅ СЛЕДУЮЩИЙ ШАГ

**Что делаем сейчас?**

1. **Создаю Git tag для текущей версии** (MVP-GOLDEN-v1.0 уже есть)
2. **Создаю детальный план миграций БД**
3. **Начинаю с Этапа 1: База данных**

**Подтверждаете план?** Или хотите что-то изменить/дополнить?
