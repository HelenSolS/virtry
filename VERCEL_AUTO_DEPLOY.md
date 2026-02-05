# 🚀 Автоматический деплой Vercel из GitHub

## Правильная архитектура

```
GitHub (единственный источник правды)
   ↓ git push
Vercel (автоматический деплой)
   ↓
Production URL
```

## 📋 Настройка автодеплоя (один раз)

### Шаг 1: Подключите GitHub к Vercel

1. Откройте https://vercel.com/dashboard
2. Нажмите **Add New** → **Project**
3. Нажмите **Import Git Repository**
4. **Авторизуйте GitHub** (если ещё не сделали):
   - Install Vercel GitHub App
   - Дайте доступ к репозиторию `HelenSolS/virtry`
5. Выберите репозиторий `HelenSolS/virtry`
6. Нажмите **Import**

### Шаг 2: Настройте проект

#### Configure Project:

**Framework Preset**: Other

**Root Directory**: `./` (оставьте по умолчанию)

**Build Settings**:
- **Build Command**: `npm run build` (уже настроено)
- **Output Directory**: `dist` (уже настроено)
- **Install Command**: `npm install` (автоматически)

**Branch Configuration**:
- **Production Branch**: `main` (или `vercel-deployment`)
- **Preview Branches**: Enable для всех веток

#### Environment Variables (ДВЕ переменные):

**GATEWAY_URL**:
```
https://gateway.ai.cloudflare.com/v1/{account_id}/virtry-gateway/google-ai-studio/v1beta/models/gemini-2.5-flash-image:generateContent
```

**GATEWAY_TOKEN**:
```
cf_xxxxxxxxxxxxx
```

> ⚠️ Замените `{account_id}` на ваш Cloudflare Account ID  
> ⚠️ Замените `cf_xxxxxxxxxxxxx` на ваш Cloudflare API Token

### Шаг 3: Deploy!

Нажмите **Deploy** 🚀

Через 1-2 минуты ваш сайт будет доступен!

---

## 🔄 Workflow после настройки

### Автоматический деплой

После настройки, каждый `git push` автоматически деплоится:

```bash
# Вы работаете локально
cd /home/user/webapp
git checkout main  # или vercel-deployment

# Вносите изменения
nano src/index.tsx

# Коммитите и пушите
git add .
git commit -m "Update feature X"
git push origin main

# 🎉 Vercel автоматически:
# 1. Видит новый commit
# 2. Запускает build
# 3. Деплоит новую версию
# 4. Уведомляет вас (email, Slack, Discord)
```

**Время**: ~1-2 минуты от `git push` до Production!

---

## 🌳 Рекомендуемая структура веток

### Вариант A: Simple (для маленьких проектов)

```
main (Production)
  ↓
Vercel Production
https://virtry.vercel.app
```

**Workflow**:
```bash
git checkout main
# делаете изменения
git commit -m "Fix bug"
git push origin main
# → автодеплой на Production
```

---

### Вариант B: Staging + Production ⭐ РЕКОМЕНДУЮ

```
main (Production)
  ↓
Vercel Production
https://virtry.vercel.app

staging (Test)
  ↓
Vercel Preview
https://virtry-git-staging.vercel.app
```

**Workflow**:
```bash
# 1. Разработка в staging
git checkout staging
# делаете изменения
git commit -m "New feature"
git push origin staging
# → автодеплой на Preview URL

# 2. Тестируете на Preview URL

# 3. Если всё ОК - мердж в main
git checkout main
git merge staging
git push origin main
# → автодеплой на Production
```

---

### Вариант C: Feature branches (для команды)

```
main (Production)
  ↑
  merge
  ↑
staging (Test)
  ↑
  merge
  ↑
feature/new-ui (Development)
  ↓
Vercel Preview
https://virtry-git-feature-new-ui.vercel.app
```

**Workflow**:
```bash
# 1. Создаёте feature branch
git checkout -b feature/new-ui

# 2. Работаете
git commit -m "Add new UI"
git push origin feature/new-ui
# → Vercel создаёт уникальный Preview URL

# 3. Создаёте Pull Request на GitHub
# → Vercel добавляет комментарий с Preview URL

# 4. Тестируете, получаете review

# 5. Мердж в staging
git checkout staging
git merge feature/new-ui
git push origin staging
# → деплой на Staging Preview

# 6. Финальный тест на staging

# 7. Мердж в main
git checkout main
git merge staging
git push origin main
# → деплой на Production
```

---

## 📊 Что происходит при каждом push

```
git push origin main
  ↓
GitHub получает commit
  ↓
GitHub Webhook → Vercel
  ↓
Vercel клонирует репозиторий
  ↓
Vercel запускает: npm install
  ↓
Vercel запускает: npm run build
  ↓
Vercel деплоит dist/ на edge network
  ↓
Vercel отправляет уведомление
  ↓
✅ Production обновлён!
```

**Время**: 1-2 минуты

---

## 🎯 Vercel Preview Deployments

### Что это?

Для каждого Pull Request и каждой ветки Vercel создаёт **уникальный preview URL**.

**Пример**:
- `main` → `https://virtry.vercel.app` (Production)
- `staging` → `https://virtry-git-staging.vercel.app` (Preview)
- `feature/new-ui` → `https://virtry-git-feature-new-ui.vercel.app` (Preview)
- PR #5 → `https://virtry-git-pr-5.vercel.app` (Preview)

### Как использовать:

1. Создаёте новую ветку:
   ```bash
   git checkout -b feature/new-design
   git push origin feature/new-design
   ```

2. Vercel автоматически создаёт Preview URL

3. Открываете URL и тестируете

4. Если всё ОК - создаёте Pull Request

5. После merge в main - изменения попадают в Production

---

## ⚙️ Настройки в Vercel Dashboard

### Production Branch

**Settings** → **Git** → **Production Branch**

Выберите ветку, которая будет Production:
- `main` (стандартная)
- или `vercel-deployment` (ваш случай)

### Preview Deployments

**Settings** → **Git** → **Preview Deployments**

Опции:
- ✅ **All branches** - preview для всех веток (рекомендую)
- ⚪ **Only production branch** - только main
- ⚪ **None** - без preview

**Рекомендация**: All branches

### Ignored Build Step

**Settings** → **Git** → **Ignored Build Step**

Можно пропускать билды для определённых условий:
```bash
# Пример: не билдить для docs изменений
git diff HEAD^ HEAD --quiet ./docs/
```

---

## 🔔 Уведомления

Vercel может отправлять уведомления о деплоях:

1. **Email** (по умолчанию)
2. **Slack**
3. **Discord**
4. **Webhooks**

**Настройка**:
**Settings** → **Notifications** → выберите канал

---

## 🔄 Откат версии (Rollback)

Если что-то сломалось:

1. Откройте **Deployments**
2. Найдите последнюю рабочую версию
3. Нажмите **⋯** → **Promote to Production**
4. Готово! Откат за 10 секунд

---

## 📊 Мониторинг

После каждого деплоя можно проверить:

### В Vercel Dashboard:

1. **Deployments** → последний деплой:
   - ✅ Build Logs (что произошло при билде)
   - ✅ Function Logs (логи API endpoints)
   - ✅ Analytics (трафик, скорость)

2. **Analytics**:
   - Page views
   - Top pages
   - Top referrers
   - Real User Monitoring

3. **Speed Insights**:
   - Core Web Vitals
   - Performance score
   - Recommendations

---

## 🐛 Troubleshooting

### Build fails

**Проблема**: Vercel не может собрать проект

**Решение**:
1. Откройте **Deployments** → Failed deployment
2. Посмотрите **Build Logs**
3. Найдите ошибку (обычно красным)
4. Исправьте в коде и запушьте

**Частые ошибки**:
- Missing dependencies в `package.json`
- TypeScript errors
- Environment variables not set

### Deployment successful, but site broken

**Проблема**: Build прошёл, но сайт не работает

**Решение**:
1. Откройте **Functions** → **Logs**
2. Найдите ошибки в runtime
3. Проверьте Environment Variables
4. Проверьте API endpoints

### Environment variables not working

**Проблема**: GATEWAY_URL или GATEWAY_TOKEN не работают

**Решение**:
1. **Settings** → **Environment Variables**
2. Проверьте значения
3. Убедитесь, что выбрано **Production** (и **Preview** если нужно)
4. После изменения - **Redeploy** проект

---

## 💡 Best Practices

### 1. Всегда используйте ветки

```bash
# ❌ Плохо: работать напрямую в main
git checkout main
git commit -m "Fix"
git push origin main

# ✅ Хорошо: создать feature branch
git checkout -b fix/api-error
git commit -m "Fix API error"
git push origin fix/api-error
# → создать Pull Request
# → протестировать Preview URL
# → merge в main
```

### 2. Используйте Pull Requests

- ✅ Code review
- ✅ Автоматические Preview URLs
- ✅ CI/CD checks
- ✅ История изменений

### 3. Защитите Production branch

На GitHub:
1. **Settings** → **Branches** → **Branch protection rules**
2. Добавьте rule для `main`:
   - ✅ Require pull request reviews
   - ✅ Require status checks (Vercel)
   - ✅ Require branches to be up to date

### 4. Мониторьте деплои

- Подключите Slack/Discord уведомления
- Проверяйте logs после каждого деплоя
- Используйте Vercel Analytics

### 5. Тестируйте на Preview URL перед Production

```bash
# 1. Push в feature branch
git push origin feature/new-design

# 2. Откройте Preview URL
https://virtry-git-feature-new-design.vercel.app

# 3. Тестируйте

# 4. Если OK - merge в main
```

---

## 🎯 Итоговый Workflow (рекомендуемый)

### Setup (один раз):

1. ✅ Подключите GitHub к Vercel
2. ✅ Настройте Environment Variables
3. ✅ Выберите Production Branch (`main`)
4. ✅ Enable Preview Deployments для всех веток

### Ежедневная работа:

```bash
# 1. Создайте feature branch
git checkout -b feature/new-feature

# 2. Работайте, коммитьте
git add .
git commit -m "Add new feature"

# 3. Push на GitHub
git push origin feature/new-feature
# → Vercel автоматически создаёт Preview URL

# 4. Откройте Preview URL и тестируйте

# 5. Создайте Pull Request на GitHub

# 6. После review - merge в main

# 7. GitHub автоматически мерджит

# 8. Vercel автоматически деплоит на Production
```

**Время от commit до Production**: 2-3 минуты!

---

## 📚 Полезные команды

```bash
# Проверить текущую ветку
git branch

# Создать новую ветку
git checkout -b feature/name

# Переключиться на ветку
git checkout main

# Обновить локальную ветку
git pull origin main

# Посмотреть статус
git status

# Посмотреть логи
git log --oneline

# Откатить изменения
git reset --hard HEAD^

# Посмотреть remote URLs
git remote -v
```

---

## 🔗 Полезные ссылки

- **Vercel Git Integration**: https://vercel.com/docs/deployments/git
- **Preview Deployments**: https://vercel.com/docs/deployments/preview-deployments
- **Environment Variables**: https://vercel.com/docs/projects/environment-variables
- **Rollbacks**: https://vercel.com/docs/deployments/rollback

---

## ✅ Итог

### Что получается:

1. **GitHub** - единственный источник правды
2. **Vercel** - автоматически деплоит каждый commit
3. **Preview URLs** - для каждой ветки и PR
4. **Production** - обновляется автоматически при merge в main
5. **Rollback** - за 10 секунд если что-то сломалось

### Вам больше не нужно:

- ❌ Ручной деплой через CLI
- ❌ Следить за двумя версиями
- ❌ Копировать код между Cloudflare и Vercel
- ❌ Беспокоиться о синхронизации

### Всё автоматически:

- ✅ `git push` → автодеплой
- ✅ Pull Request → preview URL
- ✅ Merge → production update
- ✅ Уведомления о статусе
- ✅ Логи и аналитика

---

## 🚀 Следующий шаг

**Подключите GitHub к Vercel прямо сейчас!**

1. Откройте https://vercel.com/dashboard
2. **Add New** → **Project**
3. **Import Git Repository** → `HelenSolS/virtry`
4. Настройте Environment Variables
5. **Deploy**

**Готово!** Больше не нужно следить за двумя ресурсами! 🎉
