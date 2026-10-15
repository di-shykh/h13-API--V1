import {HttpStatus, INestApplication} from "@nestjs/common";
import {generateBasicAuthToken} from "../../utils/auth-utils";
import {createUser} from "../../utils/users/create-user";
import request from "supertest";
import {loginUser} from "../../utils/users/login-user";
import {createExpiredToken, validateJWT} from "../../utils/auth/token.helpers";
import {getCookiesString, hasCookieWithName, validateRefreshTokenCookie} from "../../utils/auth/cookies.helpers";
import {AUTH_PATH} from "../../../src/core/paths/paths";
import {clearDatabase, initApp} from "../../helpers/app-helper";

describe('Auth Controller (e2e)',()=>{
    let app: INestApplication;

    const TEST_USER = {
        login: 'TestUser',
        password: 'password123',
        email: 'test@example.com'
    }
    const TEST_USER_2 = {
        login: 'Anya',
        password: '12345678',
        email: 'anna@email.com'
    }

    const adminToken: string = generateBasicAuthToken();
    beforeAll(async () => {
        app = await initApp();
    });
    beforeEach(async () => {
        await clearDatabase(app);
    });

    describe('POST /auth/login',()=>{
        describe('Successful login scenarios', ()=>{
            it('should login with login and return access token + refresh cookie', async()=>{
                const user = await createUser(app, adminToken, {
                    login: TEST_USER_2.login,
                    password: TEST_USER_2.password,
                    email: TEST_USER_2.email
                });
                const result = await loginUser(app, {
                    loginOrEmail: TEST_USER_2.login,
                    password: TEST_USER_2.password,
                });
                validateJWT(result.accessToken);
                validateRefreshTokenCookie(result.refreshTokenCookie);
                expect(hasCookieWithName(result.refreshTokenCookie,'refreshToken')).toBe(true);
            });
            it('should login with email and return access token + refresh cookie', async()=>{
                const user = await createUser(app, adminToken, {
                    login: TEST_USER_2.login,
                    password: TEST_USER_2.password,
                    email: TEST_USER_2.email
                });
                const result = await loginUser(app, {
                    loginOrEmail: TEST_USER_2.email,
                    password: TEST_USER_2.password,
                });
                validateJWT(result.accessToken);
                validateRefreshTokenCookie(result.refreshTokenCookie);
                expect(hasCookieWithName(result.refreshTokenCookie,'refreshToken')).toBe(true);
            });
        });
        describe('Failed login scenarios', ()=>{
            beforeEach(async () => {
                const user = await createUser(app, adminToken, {
                    login: 'Alya',
                    password: '12345678',
                    email: 'alya@email.com'
                });
            });
            it('should return 401 for empty loginOrEmail', async()=>{
                const response = await request(app.getHttpServer())
                    .post(`${AUTH_PATH}/login`)
                    .send({loginOrEmail: '', password: '12345678'})
                    .expect(HttpStatus.UNAUTHORIZED);
                const cookies = getCookiesString(response);
                expect(cookies).not.toContain('refreshToken=');
            });
            it('should return 401 for empty password', async()=>{
                const response = await request(app.getHttpServer())
                    .post(`${AUTH_PATH}/login`)
                    .send({loginOrEmail: 'Alya', password: ''})
                    .expect(HttpStatus.UNAUTHORIZED);
                const cookies = getCookiesString(response);
                expect(cookies).not.toContain('refreshToken=');
            });
            it('should return 401 for wrong password', async()=>{
                const response = await request(app.getHttpServer())
                    .post(`${AUTH_PATH}/login`)
                    .send({loginOrEmail: 'alya@email.com', password: 'wrongwrongpas'})
                    .expect(HttpStatus.UNAUTHORIZED);
                const cookies = getCookiesString(response);
                expect(cookies).not.toContain('refreshToken=');
            });
            it('should return 401 for non-existent user', async()=>{
                const response = await request(app.getHttpServer())
                    .post(`${AUTH_PATH}/login`)
                    .send({loginOrEmail: 'nonexistent', password: '12345678'})
                    .expect(HttpStatus.UNAUTHORIZED);
                const cookies = getCookiesString(response);
                expect(cookies).not.toContain('refreshToken=');
            });
        });
    });
    describe('GET /auth/me', ()=>{
        describe('Successful access', ()=>{
            it('should return user data with valid access token', async()=>{
                const user = await createUser(app, adminToken, {
                    login: TEST_USER.login,
                    password: TEST_USER.password,
                    email: TEST_USER.email
                });
                const {accessToken} = await loginUser(app, {
                    loginOrEmail: TEST_USER.login,
                    password: TEST_USER.password,
                });
                const response = await request(app.getHttpServer())
                    .get(`${AUTH_PATH}/me`)
                    .set('Authorization', `Bearer ${accessToken}`)
                    .expect(HttpStatus.OK);
                expect(response.body).toEqual({
                    email: TEST_USER.email,
                    login: TEST_USER.login,
                    userId: expect.any(String),
                });
            });
        });
        describe('Failed access', ()=>{
            it('should return 401 if try to access with expired token', async()=>{
                const user = await createUser(app, adminToken, {
                    login: TEST_USER.login,
                    password: TEST_USER.password,
                    email: TEST_USER.email
                });
                const expiredToken = createExpiredToken(user.id);
                const response = await request(app.getHttpServer())
                    .get(`${AUTH_PATH}/me`)
                    .set('Authorization', `Bearer ${expiredToken}`)
                    .expect(HttpStatus.UNAUTHORIZED);
            });
            it('should return 401 try to access without token', async()=>{
                const user = await createUser(app, adminToken, {
                    login: TEST_USER.login,
                    password: TEST_USER.password,
                    email: TEST_USER.email
                });
                const {accessToken} = await loginUser(app, {
                    loginOrEmail: TEST_USER.login,
                    password: TEST_USER.password,
                });
                const response = await request(app.getHttpServer())
                    .get(`${AUTH_PATH}/me`)
                    .expect(HttpStatus.UNAUTHORIZED);
            });
        });
    });
    afterAll(async () => {
        await app.close();
    });
})