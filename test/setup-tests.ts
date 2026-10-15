import * as dotenv from 'dotenv';
import * as path from 'path';

// Загружаем переменные из .env.testing, который лежит в корне проекта
dotenv.config({ path: path.resolve(__dirname, '../.env.testing') });