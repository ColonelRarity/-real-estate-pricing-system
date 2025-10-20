#!/bin/bash

# Скрипт для швидкого розгортання на GitHub та Render

echo "🚀 Починаємо розгортання системи оцінки нерухомості..."
echo "=================================================="

# Перевіряємо Git статус
if ! git status >/dev/null 2>&1; then
    echo "❌ Помилка: Поточна директорія не є Git репозиторієм"
    exit 1
fi

echo "✅ Git репозиторій знайдено"

# Перевіряємо чи є незакомічені зміни
if ! git diff --quiet || ! git diff --staged --quiet; then
    echo "⚠️  Знайдені незакомічені зміни. Коммітимо їх..."
    git add .
    git commit -m "feat: prepare for deployment

- Add render.yaml for automated deployment
- Add README_DEPLOYMENT.md with deployment instructions
- Add deploy.sh script for easy deployment
- Update .gitignore for production"
fi

echo "✅ Всі зміни закомічені"

# Штовхаємо в GitHub
echo "📤 Відправляємо код в GitHub..."
git push origin main

echo "✅ Код відправлено в GitHub"

echo ""
echo "🎉 Розгортання готове!"
echo ""
echo "Наступні кроки:"
echo "1. Створіть репозиторій на GitHub (якщо ще не створили)"
echo "2. Додайте віддалений репозиторій: git remote add origin https://github.com/YOUR_USERNAME/real-estate-pricing-system.git"
echo "3. Відправте код: git push -u origin main"
echo "4. Перейдіть до Render Dashboard та розгорніть сервіси"
echo ""
echo "Детальна інструкція в файлі README_DEPLOYMENT.md"
