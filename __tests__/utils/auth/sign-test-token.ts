import jwt from 'jsonwebtoken';

export function signTestToken(userId: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('Тестовая ошибка: process.env.JWT_SECRET не инициализирован в Jest!');
    }
    return jwt.sign({ userId }, secret, {
        expiresIn: '1h',
    });
}