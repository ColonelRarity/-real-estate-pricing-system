#!/usr/bin/env python3
"""
Скрипт для установки зависимостей машинного обучения
"""

import subprocess
import sys
import importlib.util

def check_and_install_package(package_name, import_name=None):
    """Проверяет и устанавливает пакет"""
    if import_name is None:
        import_name = package_name

    try:
        # Проверяем, установлен ли пакет
        importlib.import_module(import_name)
        print(f"✓ {package_name} уже установлен")
        return True
    except ImportError:
        print(f"❌ {package_name} не установлен. Устанавливаю...")
        try:
            # Устанавливаем пакет
            subprocess.check_call([sys.executable, "-m", "pip", "install", package_name])
            print(f"✓ {package_name} успешно установлен")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Ошибка установки {package_name}: {e}")
            return False

def main():
    """Основная функция"""
    print("🚀 Установка зависимостей машинного обучения...\n")

    packages = [
        ("scikit-learn", "sklearn"),
        ("pandas", "pandas"),
        ("numpy", "numpy"),
        ("joblib", "joblib")
    ]

    success_count = 0

    for package_name, import_name in packages:
        if check_and_install_package(package_name, import_name):
            success_count += 1

    print(f"\n📊 Результат: {success_count}/{len(packages)} пакетов установлено успешно")

    if success_count == len(packages):
        print("✅ Все зависимости ML установлены! Теперь можно использовать полную функциональность моделей.")
    else:
        print("⚠️  Некоторые пакеты не удалось установить. Проверьте подключение к интернету и права доступа.")

    return success_count == len(packages)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
