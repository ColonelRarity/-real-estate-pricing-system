# 🚀 Розгортання системи оцінки нерухомості на GitHub та Render

## Огляд архітектури

Система складається з трьох основних компонентів:
- **Backend API** (Python/FastAPI) - REST API для оцінки нерухомості
- **Автоматичний парсинг** - система збору даних кожну годину
- **Веб інтерфейс** (React) - користувацький інтерфейс

## 📋 Покрокова інструкція розгортання

### Крок 1: GitHub репозиторій

#### 1.1 Створити новий репозиторій на GitHub

1. Перейдіть на [GitHub.com](https://github.com)
2. Натисніть **"New repository"**
3. Назва: `real-estate-pricing-system` (або ваша назва)
4. Опис: `Comprehensive real estate pricing and valuation system with automated data collection`
5. Виберіть **"Public"** або **"Private"**
6. **НЕ** додавайте README, .gitignore або license (вони вже є)
7. Натисніть **"Create repository"**

#### 1.2 Додати віддалений репозиторій

```bash
# В кореневій директорії проекту
git remote add origin https://github.com/YOUR_USERNAME/real-estate-pricing-system.git
git branch -M main
git push -u origin main
```

### Крок 2: Налаштування Render

#### 2.1 Створити аккаунт на Render

1. Перейдіть на [render.com](https://render.com)
2. Зареєструйтесь або увійдіть
3. Підтвердіть email адресу

#### 2.2 Розгорнути Backend API

**Створити новий Web Service:**

1. В Dashboard Render натисніть **"New +"**
2. Виберіть **"Web Service"**
3. Підключіть ваш GitHub репозиторій

**Налаштування Backend:**

```yaml
# render.yaml для backend
services:
  - type: web
    name: real-estate-backend
    runtime: python
    buildCommand: |
      cd real-estate-app/backend &&
      pip install -r requirements.txt
    startCommand: |
      cd real-estate-app/backend &&
      python -c "from database import DatabaseManager; db = DatabaseManager(); db.create_tables(); db.initialize_cities_and_districts()" &&
      python main.py
    envVars:
      - key: DATABASE_URL
        value: postgresql://user:pass@host:5432/dbname
      - key: PYTHON_VERSION
        value: 3.11.0
```

**Альтернатива - через Dashboard:**

- **Name**: `real-estate-backend`
- **Runtime**: `Python 3`
- **Build Command**:
  ```bash
  cd real-estate-app/backend && pip install -r requirements.txt
  ```
- **Start Command**:
  ```bash
  cd real-estate-app/backend &&
  python -c "from database import DatabaseManager; db = DatabaseManager(); db.create_tables(); db.initialize_cities_and_districts()" &&
  python main.py
  ```

**Змінні оточення для Backend:**

```bash
DATABASE_URL=postgresql://... (отримайте від Render PostgreSQL)
FLASK_ENV=production
```

#### 2.3 Розгорнути автоматичну систему парсингу

**Створити Background Worker:**

1. В Dashboard Render натисніть **"New +"**
2. Виберіть **"Background Worker"**
3. Підключіть ваш GitHub репозиторій

**Налаштування Scraping Service:**

```yaml
# render.yaml для scraper
services:
  - type: worker
    name: real-estate-scraper
    runtime: python
    buildCommand: |
      cd real-estate-app/data-collection &&
      pip install -r requirements.txt
    startCommand: |
      cd real-estate-app/data-collection &&
      python start_auto_scraper.py
    envVars:
      - key: DATABASE_URL
        value: postgresql://user:pass@host:5432/dbname
      - key: TELEGRAM_BOT_TOKEN
        value: your_bot_token (опціонально)
      - key: TELEGRAM_CHAT_ID
        value: your_chat_id (опціонально)
```

**Через Dashboard:**

- **Name**: `real-estate-scraper`
- **Runtime**: `Python 3`
- **Build Command**:
  ```bash
  cd real-estate-app/data-collection && pip install -r requirements.txt
  ```
- **Start Command**:
  ```bash
  cd real-estate-app/data-collection && python start_auto_scraper.py
  ```

#### 2.4 Розгорнути веб інтерфейс

**Створити Static Site:**

1. В Dashboard Render натисніть **"New +"**
2. Виберіть **"Static Site"**
3. Підключіть ваш GitHub репозиторій

**Налаштування Web App:**

```yaml
# render.yaml для web
services:
  - type: web
    name: real-estate-web
    runtime: node
    buildCommand: |
      cd real-estate-app/web &&
      npm install &&
      npm run build
    publishDir: real-estate-app/web/build
    envVars:
      - key: REACT_APP_API_URL
        value: https://your-backend-service.onrender.com
```

**Через Dashboard:**

- **Name**: `real-estate-web`
- **Runtime**: `Node.js`
- **Build Command**:
  ```bash
  cd real-estate-app/web && npm install && npm run build
  ```
- **Publish Directory**: `real-estate-app/web/build`

**Змінні оточення для Web:**

```bash
REACT_APP_API_URL=https://your-backend-service.onrender.com
```

### Крок 3: База даних

#### 3.1 Створити PostgreSQL на Render

1. В Dashboard Render натисніть **"New +"**
2. Виберіть **"PostgreSQL"**
3. Назва: `real-estate-db`
4. Виберіть план (можна почати з безкоштовного)

#### 3.2 Оновити змінні оточення

Після створення бази даних Render надасть `DATABASE_URL`. Оновіть його в:

- Backend service
- Scraper service

Формат: `postgresql://user:password@host:5432/database`

### Крок 4: Налаштування доменів

#### 4.1 Кастомні домени (опціонально)

Для продакшену можете додати кастомні домени:

- **Backend**: `api.yourdomain.com`
- **Web**: `yourdomain.com` або `app.yourdomain.com`

### Крок 5: Моніторинг та логи

#### 5.1 Моніторинг на Render

- Переглядайте логи в Dashboard
- Моніторте використання ресурсів
- Налаштуйте alerting (на платних планах)

#### 5.2 Telegram сповіщення

Для моніторингу парсингу налаштуйте Telegram бота:

1. Створіть бота в [@BotFather](https://t.me/botfather)
2. Отримайте `TELEGRAM_BOT_TOKEN`
3. Отримайте ваш `chat_id`
4. Додайте змінні до Scraper service

### Крок 6: Тестування розгортання

#### 6.1 Перевірити Backend API

```bash
curl https://your-backend-service.onrender.com/health
```

#### 6.2 Перевірити базу даних

```bash
# Через psql або будь-який PostgreSQL клієнт
psql "your-database-url"
```

#### 6.3 Перевірити веб додаток

Відкрийте `https://your-web-service.onrender.com`

#### 6.4 Перевірити автоматичний парсинг

- Перегляньте логи scraper service в Render Dashboard
- Переконайтеся що база даних заповнюється новими оголошеннями

## 🔧 Налаштування для продакшену

### Безпека

1. **Секретні ключі**:
   - Використовуйте Render secrets для чутливих даних
   - Не комітьте секрети в Git

2. **HTTPS**:
   - Render автоматично надає SSL сертифікати

3. **CORS**:
   - Налаштуйте CORS в backend для веб додатку

### Продуктивність

1. **Кешування**:
   - Додайте Redis для кешування (опціонально)
   - Налаштуйте CDN для статичних файлів

2. **Масштабування**:
   - Почніть з безкоштовних планів
   - Моніторте використання та масштабуйте при потребі

### Резервне копіювання

1. **База даних**:
   - Render автоматично створює бекапи PostgreSQL
   - Налаштуйте додаткові бекапи при потребі

2. **Код**:
   - GitHub вже має версійний контроль
   - Можна налаштувати автоматичні бекапи репозиторію

## 🚨 Важливі моменти

### Вартість

**Безкоштовний план Render включає:**
- 512 MB RAM для веб сервісів
- 100 годин використання на місяць
- PostgreSQL до 1GB

**Для автоматичного парсингу:**
- Може потребувати платного плану через інтенсивне використання

### Обмеження

1. **Парсинг**:
   - Дотримуйтесь robots.txt сайтів
   - Не перевищуйте розумні ліміти запитів

2. **База даних**:
   - Моніторте розмір бази даних
   - Регулярно очищайте старі дані

3. **API ліміти**:
   - Врахуйте rate limiting від сайтів-джерел

## 🔍 Пошук та усунення несправностей

### Загальні проблеми

1. **Сервіс не запускається**:
   - Перевірити логи в Render Dashboard
   - Переконатися що всі залежності встановлені

2. **База даних недоступна**:
   - Перевірити DATABASE_URL
   - Переконатися що база даних запущена

3. **Парсинг не працює**:
   - Перевірити чи доступні сайти-джерела
   - Перевірити логи scraper service

4. **Веб додаток не завантажується**:
   - Перевірити REACT_APP_API_URL
   - Переконатися що backend API доступний

### Логи для діагностики

```bash
# В Render Dashboard
Dashboard → Ваш сервіс → Logs

# Для локального тестування
tail -f auto_scraping.log
```

## 📞 Підтримка

- **Документація Render**: [docs.render.com](https://docs.render.com)
- **Документація проекту**: [README файли в репозиторії]
- **GitHub Issues**: для баг-репортів та запитів функцій

## 🎯 Наступні кроки після розгортання

1. **Тестування**:
   - Переконайтеся що всі компоненти працюють
   - Протестуйте оцінку нерухомості

2. **Моніторинг**:
   - Налаштуйте моніторинг продуктивності
   - Відстежуйте логи парсингу

3. **Масштабування**:
   - Додайте більше міст/джерел при потребі
   - Налаштуйте резервне копіювання

4. **Безпека**:
   - Перегляньте та оновіть налаштування безпеки
   - Налаштуйте моніторинг помилок

---

**🎉 Вітаємо! Ваша система оцінки нерухомості тепер запущена в продакшені!**
