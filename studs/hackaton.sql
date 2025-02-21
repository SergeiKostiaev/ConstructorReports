-- phpMyAdmin SQL Dump
-- version 5.1.0
-- https://www.phpmyadmin.net/
--
-- Хост: 127.0.0.1:3306
-- Время создания: Окт 22 2024 г., 14:13
-- Версия сервера: 8.0.24
-- Версия PHP: 8.0.8

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `hackaton`
--

-- --------------------------------------------------------

--
-- Структура таблицы `categories`
--

CREATE TABLE `categories` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `categories`
--

INSERT INTO `categories` (`id`, `name`) VALUES
(1, 'Категория 1'),
(2, 'Категория 2'),
(3, 'Категория 3');

-- --------------------------------------------------------

--
-- Структура таблицы `companies`
--

CREATE TABLE `companies` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `companies`
--

INSERT INTO `companies` (`id`, `name`) VALUES
(1, '347852634896'),
(2, 'FD43F6KHJ5234'),
(3, 'TESTIDCOPMANY12345');

-- --------------------------------------------------------

--
-- Структура таблицы `reports`
--

CREATE TABLE `reports` (
  `id` bigint UNSIGNED NOT NULL,
  `category_id` bigint UNSIGNED DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `extension` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `headers` json NOT NULL,
  `data` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `reports`
--

INSERT INTO `reports` (`id`, `category_id`, `name`, `extension`, `user_id`, `headers`, `data`, `created_at`, `updated_at`) VALUES
(28, NULL, 'report', 'json', 3, '[{\"fx\": \"\", \"name\": \"fio_sotrudnika\", \"title\": \"ФИО сотрудника\", \"where\": []}, {\"fx\": \"\", \"name\": \"professiya\", \"title\": \"Профессия\", \"where\": []}, {\"fx\": \"\", \"name\": \"zarplata\", \"title\": \"Зарплата\", \"where\": []}, {\"fx\": \"\", \"name\": \"stavka\", \"title\": \"Ставка\", \"where\": []}, {\"fx\": \"\", \"name\": \"data_podpisaniya_dogovora\", \"title\": \"Дата подписания договора\", \"where\": []}]', '[[\"Иванов Иван Иванович\", \"Web-разработчик\", 50000, 1, \"2022-01-01\"], [\"Сидоров Сидор Сидорович\", \"Designer\", 100000, 0.5, \"2020-11-21\"], [\"Шарипов Олег Владимирович\", \"Web-разработчик\", 25500.51, 0.4, \"2021-06-14\"], [\"Мингазов Антон Витальевич\", \"Менеджер\", 70000, 1, \"2018-02-15\"], [\"Мухин Денис Иванович\", \"Директор\", 228000, 1, \"2018-01-15\"]]', '2024-10-22 04:49:36', '2024-10-22 04:49:36'),
(30, NULL, 'old_to_now', 'json', 3, '[{\"fx\": null, \"name\": \"1fio_sotrudnika\", \"title\": \"1ФИО сотрудника\", \"where\": []}, {\"fx\": null, \"name\": \"professiya\", \"title\": \"Профессия\", \"where\": []}, {\"fx\": null, \"name\": \"zarplata\", \"title\": \"Зарплата\", \"where\": []}, {\"fx\": null, \"name\": \"stavka\", \"title\": \"Ставка\", \"where\": []}, {\"fx\": null, \"name\": \"data_podpisaniya_dogovora\", \"title\": \"Дата подписания договора\", \"where\": []}]', '[[\"2Иванов Иван Иванович\", \"2Web-разработчик\", 50000, 1, \"2022-01-01\"], [\"Сидоров Сидор Сидорович\", \"Designer\", 100000, 0.5, \"2020-11-21\"], [\"Шарипов Олег Владимирович\", \"Web-разработчик\", 25500.51, 0.4, \"2021-06-14\"], [\"Мингазов Антон Витальевич\", \"Менеджер\", 70000, 1, \"2018-02-15\"], [\"Мухин Денис Иванович\", \"Директор\", 228000, 1, \"2018-01-15\"]]', '2024-10-22 06:11:16', '2024-10-22 06:11:16'),
(31, 2, 'old_to_now', 'json', 3, '[{\"fx\": null, \"name\": \"1fio_sotrudnika\", \"title\": \"1ФИО сотрудника\", \"where\": []}, {\"fx\": null, \"name\": \"professiya\", \"title\": \"Профессия\", \"where\": []}, {\"fx\": null, \"name\": \"zarplata\", \"title\": \"Зарплата\", \"where\": []}, {\"fx\": null, \"name\": \"stavka\", \"title\": \"Ставка\", \"where\": []}, {\"fx\": null, \"name\": \"data_podpisaniya_dogovora\", \"title\": \"Дата подписания договора\", \"where\": []}]', '[[\"2Иванов Иван Иванович\", \"2Web-разработчик\", 50000, 1, \"2022-01-01\"], [\"Сидоров Сидор Сидорович\", \"Designer\", 100000, 0.5, \"2020-11-21\"], [\"Шарипов Олег Владимирович\", \"Web-разработчик\", 25500.51, 0.4, \"2021-06-14\"], [\"Мингазов Антон Витальевич\", \"Менеджер\", 70000, 1, \"2018-02-15\"], [\"Мухин Денис Иванович\", \"Директор\", 228000, 1, \"2018-01-15\"]]', '2024-10-22 06:11:48', '2024-10-22 06:11:48'),
(32, 2, 'old_to_now', 'json', 3, '[{\"fx\": null, \"name\": \"1fio_sotrudnika\", \"title\": \"1ФИО сотрудника\", \"where\": []}, {\"fx\": null, \"name\": \"professiya\", \"title\": \"Профессия\", \"where\": []}, {\"fx\": null, \"name\": \"zarplata\", \"title\": \"Зарплата\", \"where\": []}, {\"fx\": null, \"name\": \"stavka\", \"title\": \"Ставка\", \"where\": []}, {\"fx\": null, \"name\": \"data_podpisaniya_dogovora\", \"title\": \"Дата подписания договора\", \"where\": []}]', '[[\"2Иванов Иван Иванович\", \"2Web-разработчик\", 50000, 1, \"2022-01-01\"], [\"Сидоров Сидор Сидорович\", \"Designer\", 100000, 0.5, \"2020-11-21\"], [\"Шарипов Олег Владимирович\", \"Web-разработчик\", 25500.51, 0.4, \"2021-06-14\"], [\"Мингазов Антон Витальевич\", \"Менеджер\", 70000, 1, \"2018-02-15\"], [\"Мухин Денис Иванович\", \"Директор\", 228000, 1, \"2018-01-15\"]]', '2024-10-22 06:12:35', '2024-10-22 06:12:35'),
(33, 2, '123123', 'json', 3, '[{\"fx\": null, \"name\": \"123fio_sotrudnika\", \"title\": \"ФИО сотрудника\", \"where\": []}, {\"fx\": null, \"name\": \"234professiya\", \"title\": \"Профессия\", \"where\": []}, {\"fx\": null, \"name\": \"zarplata\", \"title\": \"Зарплата\", \"where\": []}, {\"fx\": null, \"name\": \"stavka\", \"title\": \"Ставка\", \"where\": []}, {\"fx\": null, \"name\": \"data_podpisaniya_dogovora\", \"title\": \"Дата подписания договора\", \"where\": []}]', '[[\"4353Иванов Иван Иванович\", \"Web-разработчик\", 50000, 1, \"2022-01-01\"], [\"Сидоров Сидор Сидорович\", \"Designer\", 100000, 0.5, \"2020-11-21\"], [\"543Шарипов Олег Владимирович\", \"Web-разработчик\", 25500.51, 0.4, \"2021-06-14\"], [\"Мингазов Антон Витальевич\", \"Менеджер\", 70000, 1, \"2018-02-15\"], [\"Мухин Денис Иванович\", \"Директор\", 228000, 1, \"2018-01-15\"]]', '2024-10-22 06:12:54', '2024-10-22 06:31:45');

-- --------------------------------------------------------

--
-- Структура таблицы `roles`
--

CREATE TABLE `roles` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `roles`
--

INSERT INTO `roles` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'Сотрудник', '2024-10-21 06:44:07', '2024-10-21 06:44:07'),
(2, 'Менеджер', '2024-10-21 06:44:32', '2024-10-21 06:44:32');

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `role_id` bigint UNSIGNED NOT NULL DEFAULT '1',
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `confirmed` bit(1) DEFAULT NULL,
  `api_token` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `role_id`, `company_id`, `confirmed`, `api_token`, `name`, `email`, `password`, `created_at`, `updated_at`) VALUES
(2, 1, 2, b'1', NULL, 'test2', 'test2@mail.ri1', '$2y$12$FxJOSPkzkP/33xdrxcJMhufo94pUZFBznLPPuOlxljiOTi0Ez2kg6', '2024-10-21 03:22:30', '2024-10-22 05:36:00'),
(3, 2, 3, b'1', 'FLGjvBqY5EGxc6P1', 'test1', 'test1@mail.ri1', '$2y$12$pJs9ynQVyOYON4fvrmh1H.PGxnr4MV9uGdXhRDjq1VrXcylxAOKSG', '2024-10-21 03:23:53', '2024-10-21 14:21:54');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Индексы таблицы `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `role_id` (`role_id`),
  ADD KEY `company_id` (`company_id`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT для таблицы `companies`
--
ALTER TABLE `companies`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT для таблицы `reports`
--
ALTER TABLE `reports`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT для таблицы `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT для таблицы `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  ADD CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Ограничения внешнего ключа таблицы `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
