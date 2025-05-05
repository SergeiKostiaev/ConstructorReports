## How run?
- composer install
- composer dump-autoload
- php artisan key:generate
- change .env
- php artisan migrate (откатить миграции: php artisan migrate:reset)
- php artisan db:seed (добавить админа admin@example.com:Test2025 и супера админа super_admin@example.com:Test2025 (CONSTRUCTORHACK2024) и 2 компании: TESTCOMPANYID123 и 234587234852345)
- php artisan serve (запустить проект в dev режиме)

## If errors, clear data:
- php artisan config:clear
- php artisan cache:clear
- php artisan config:cache
