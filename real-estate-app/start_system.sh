#!/bin/bash

# Скрипт для запуску всієї системи оцінки нерухомості
# Використання: ./start_system.sh [dev|prod]

echo "🚀 Запуск системи оцінки нерухомості України"
echo "============================================="

MODE=${1:-dev}
echo "Режим: $MODE"

# Перевіряємо чи встановлені необхідні інструменти
command -v python3 >/dev/null 2>&1 || { echo "❌ Потрібен Python 3"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ Потрібен Node.js та npm"; exit 1; }

# Функція для перевірки статусу процесу
check_process() {
    if ps aux | grep -v grep | grep "$1" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Функція для запуску сервісу
start_service() {
    local service_name=$1
    local command=$2
    local dir=$3

    echo "🔄 Запускаю $service_name..."

    if [ "$MODE" = "prod" ]; then
        # В продакшен режимі запускаємо як демони
        cd "$dir" || exit 1
        nohup $command > /dev/null 2>&1 &
        echo "✅ $service_name запущено в фоні (PID: $!)"
    else
        # В режимі розробки запускаємо на передньому плані
        cd "$dir" || exit 1
        echo "📋 Запускаю $service_name в терміналі..."
        echo "   Команда: $command"
        echo "   Директорія: $(pwd)"
        echo ""
        $command
    fi
}

# Функція для зупинки всіх сервісів
stop_all() {
    echo "🛑 Зупиняю всі сервіси..."

    # Зупиняємо Python процеси
    pkill -f "python.*main.py" 2>/dev/null
    pkill -f "python.*train_ml_model.py" 2>/dev/null
    pkill -f "python.*test_ml_model.py" 2>/dev/null

    # Зупиняємо Node.js процеси
    pkill -f "react-scripts" 2>/dev/null
    pkill -f "npm.*start" 2>/dev/null

    echo "✅ Всі сервіси зупинено"
    exit 0
}

# Обробка сигналів
trap stop_all SIGINT SIGTERM

# Запуск системи збору даних (опціонально)
if [ "$2" = "with-scrapers" ] || [ "$3" = "with-scrapers" ]; then
    echo "📊 Запускаю систему збору даних..."
    cd data-collection || exit 1

    # Встановлюємо залежності для парсерів
    if [ ! -d "venv" ]; then
        echo "📦 Встановлюю залежності для парсерів..."
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
    else
        source venv/bin/activate
    fi

    # Запускаємо збір даних в фоні
    nohup python main_scraper.py --cities "Харків" "Київ" "Львів" --sources olx dom_ria realt address --pages 2 > ../logs/scrapers.log 2>&1 &
    SCRAPER_PID=$!
    echo "✅ Система збору даних запущена (PID: $SCRAPER_PID)"
    cd ..
fi

# Запуск backend сервера
echo "🔧 Запускаю backend сервер..."
if [ "$MODE" = "prod" ]; then
    cd backend || exit 1
    # В продакшені використовуємо gunicorn або uvicorn з налаштуваннями
    nohup uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo "✅ Backend сервер запущено (PID: $BACKEND_PID)"
    cd ..
else
    start_service "Backend сервер" "python main.py" "backend"
fi

# Невелика пауза для запуску backend
sleep 3

# Запуск веб-додатку
echo "🌐 Запускаю веб-додаток..."
if [ "$MODE" = "prod" ]; then
    cd web || exit 1
    nohup npm run build > /dev/null 2>&1
    nohup npx serve -s build -l 3000 > ../logs/web.log 2>&1 &
    WEB_PID=$!
    echo "✅ Веб-додаток запущено (PID: $WEB_PID)"
    cd ..
else
    start_service "Веб-додаток" "npm start" "web"
fi

echo ""
echo "🎉 Система запущена!"
echo "========================"
echo "📊 Backend API: http://localhost:8000"
echo "🌐 Веб-додаток: http://localhost:3000"
echo "📚 Документація API: http://localhost:8000/docs"
echo ""

if [ "$MODE" = "prod" ]; then
    echo "📋 Логи сервісів:"
    echo "   Backend: logs/backend.log"
    echo "   Веб-додаток: logs/web.log"
    if [ ! -z "$SCRAPER_PID" ]; then
        echo "   Парсери: logs/scrapers.log"
    fi
    echo ""
    echo "💡 Для зупинки всіх сервісів: Ctrl+C"
else
    echo "💡 Для зупинки: Ctrl+C в кожному терміналі"
fi

# Чекаємо сигналу для завершення
if [ "$MODE" = "prod" ]; then
    echo "⏳ Система працює в фоні. Натисніть Ctrl+C для зупинки..."
    wait
else
    echo "⏳ Очікую завершення роботи..."
    wait
fi
