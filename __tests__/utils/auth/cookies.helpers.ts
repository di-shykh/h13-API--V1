import request from "supertest";

export const getCookiesString = (response: request.Response): string => {
    const cookiesHeader = response.headers['set-cookie'];
    return Array.isArray(cookiesHeader) ? cookiesHeader.join('; ') : cookiesHeader || '';
}

export const hasCookieWithName = (cookies: string, cookieName: string): boolean => {
    return cookies.includes(`${cookieName}=`);
};

export const validateRefreshTokenCookie = (cookies: string): void => {
    expect(cookies).toContain('refreshToken=');
    expect(cookies).toContain('HttpOnly');
    expect(cookies).toContain('Secure');
};