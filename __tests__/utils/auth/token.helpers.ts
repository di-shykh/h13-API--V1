import jwt, { JwtPayload } from 'jsonwebtoken';

export const validateJWT = (token: string): jwt.JwtPayload => {
        const decoded = jwt.decode(token, {complete: true});
        if (!decoded || typeof decoded === 'string') {
            throw new Error('Failed to decode JWT token');
        }
        expect(decoded.header).toHaveProperty('alg');
        expect(decoded.header.alg).toBe('HS256');

        const payload = decoded.payload as jwt.JwtPayload;

        expect(payload).toHaveProperty('userId');
        expect(payload).toHaveProperty('exp');
        expect(payload).toHaveProperty('iat');

        return payload;
}
export function extractTokenFromCookie(cookieString: string): string | null {
    if (!cookieString) return null;

    const match = cookieString.match(/(?:^|;\s*)refreshToken=([^;]+)/);
    if (!match || !match[1]) return null;

    return match[1];
}
export const createExpiredAccessToken = (userId: string): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('Тестовая ошибка: process.env.JWT_SECRET не инициализирован в Jest!');
    }
    return jwt.sign(
        {
            userId: userId,
            type: 'access',
            iat: Math.floor(Date.now() / 1000) - 3600, // выпущен час назад
            exp: Math.floor(Date.now() / 1000) - 1800  // истек полчаса назад
        },
        secret,
        { algorithm: 'HS256' }
    );
};
export const createExpiredToken = (userId:string, deviceId = 'test-device')=> {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('Тестовая ошибка: process.env.JWT_SECRET не инициализирован в Jest!');
    }
    return jwt.sign(
        {
            userId,
            deviceId,
            iat: Math.floor(Date.now() / 1000) - 3600 // issued 1 hour ago
        },
        secret,
        { expiresIn: '-1h' } // Минус 1 час - уже истек
    );
}

