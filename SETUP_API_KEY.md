# Настройка Google API ключа для Gemini 2.0 Flash

## Шаг 1: Получение API ключа

1. Перейдите на https://aistudio.google.com/apikey
2. Войдите в свой Google аккаунт
3. Нажмите "Create API Key"
4. Скопируйте созданный ключ

## Шаг 2: Настройка для локальной разработки

1. Скопируйте файл `.dev.vars.example` в `.dev.vars`:
   ```bash
   cp .dev.vars.example .dev.vars
   ```

2. Откройте `.dev.vars` и вставьте ваш API ключ:
   ```
   GOOGLE_API_KEY=AIzaSy...your_actual_key_here
   ```

3. Перезапустите сервер:
   ```bash
   npm run clean-port
   pm2 restart webapp
   ```

## Шаг 3: Настройка для Cloudflare Pages

После деплоя на Cloudflare Pages, установите секрет:

```bash
npx wrangler pages secret put GOOGLE_API_KEY --project-name webapp
```

Введите ваш API ключ когда система попросит.

## Проверка

Откройте приложение и попробуйте загрузить два изображения. 

Если API ключ настроен правильно, вы увидите результат через 10-30 секунд.

Если видите ошибку "API key not configured", проверьте:
1. Файл `.dev.vars` существует и содержит правильный ключ
2. Вы перезапустили сервер после изменения `.dev.vars`
3. В Cloudflare Pages секрет установлен командой выше

## Лимиты API

Google Gemini API имеет следующие лимиты (бесплатный тариф):
- 15 запросов в минуту
- 1500 запросов в день
- 1 миллион токенов в день

Для production использования рекомендуется настроить rate limiting.
