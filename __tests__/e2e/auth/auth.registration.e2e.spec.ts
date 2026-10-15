import {HttpStatus, INestApplication} from "@nestjs/common";
import {generateBasicAuthToken} from "../../utils/auth-utils";
import {createUser} from "../../utils/users/create-user";
import request from "supertest";
import {loginUser} from "../../utils/users/login-user";
import {createExpiredToken, validateJWT} from "../../utils/auth/token.helpers";
import {getCookiesString, hasCookieWithName, validateRefreshTokenCookie} from "../../utils/auth/cookies.helpers";
import {AUTH_PATH} from "../../../src/core/paths/paths";
import {clearDatabase, initApp} from "../../helpers/app-helper";
import {EmailService} from "../../../src/modules/notifications/email.service";
import {EmailServiceMock} from "../../mocks/email.service.mock";
import {getConnectionToken} from "@nestjs/mongoose";
import {User} from "../../../src/modules/user-accounts/domain/user.entity";

describe('Auth registration (e2e)', () => {
    let app: INestApplication;
    let emailMock: EmailServiceMock;

    const TEST_USER = {
        login: 'TestUser',
        password: 'password123',
        email: 'test@example.com'
    }
    let testNumber = 0;
    const adminToken: string = generateBasicAuthToken();
    beforeAll(async () => {
        emailMock = new EmailServiceMock();

        app = await initApp([
            (b) => b.overrideProvider(EmailService).useValue(emailMock),
        ]);
    });
    beforeEach(async () => {
        await clearDatabase(app);
        emailMock.clear();
     })
    afterAll(async () => {
        await app.close();
    });
    describe('Registration flow, successful scenarios', () => {
        it('should register user and confirm email with code: POST /api/auth/registration ', async () => {
            const registrationData = {
                login: `${TEST_USER.login}${testNumber}`,
                password: `${TEST_USER.password}`,
                email: `test${testNumber}@mail.ru`,
            }
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration`)
                .send(registrationData)
                .expect(HttpStatus.NO_CONTENT);

            expect(emailMock.sentEmails).toHaveLength(1);
            expect(emailMock.sentEmails[0].to).toBe(registrationData.email);

            const code = emailMock.getLastConfirmationCode();
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration-confirmation`)
                .send({code})
                .expect(HttpStatus.NO_CONTENT);

            const { accessToken, refreshTokenCookie } = await loginUser(app, {
                loginOrEmail: registrationData.login,
                password: registrationData.password
            });
            expect(accessToken).toBeDefined();
            validateJWT(accessToken);
            validateRefreshTokenCookie(refreshTokenCookie);
            expect(hasCookieWithName(refreshTokenCookie,'refreshToken')).toBe(true);
        });
    })
    describe('Registration, failed scenarios', () =>{
        it('should return 400 for invalid login', async () => {
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration`)
                .send({ login: 't', password: 'password123', email: 'test@mail.ru' })
                .expect(HttpStatus.BAD_REQUEST);
        });
        it('should return 400 for invalid password', async () => {
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration`)
                .send({ login: 'testLogin', password: '', email: 'test@mail.ru' })
                .expect(HttpStatus.BAD_REQUEST);
        });
        it('should return 400 for invalid email', async () => {
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration`)
                .send({ login: 'testLogin1', password: 'password123', email: '@mail.ru' })
                .expect(HttpStatus.BAD_REQUEST);
        });
        it('should return 400 for duplicate email', async () => {
            const data = { login: 'User1', password: 'password123', email: 'dup@mail.ru' };
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration`)
                .send(data)
                .expect(HttpStatus.NO_CONTENT);

            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration`)
                .send({ ...data, login: 'User2' }) // другой login, тот же email
                .expect(HttpStatus.BAD_REQUEST);
        });
        it('should return 400 for duplicate login', async () => {
            const data = { login: 'User1', password: 'password123', email: 'dup@mail.ru' };
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration`)
                .send(data)
                .expect(HttpStatus.NO_CONTENT);

            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration`)
                .send({ ...data, email: 'dup2@mail.ru' }) // другой login, тот же email
                .expect(HttpStatus.BAD_REQUEST);
        });
        it('should return 429 after too many attempts', async () => {
            const attempts = 6;
            for (let i = 0; i < attempts-1; i++) {
                await request(app.getHttpServer())
                    .post(`${AUTH_PATH}/registration`)
                    .send({login: `User${i}`, password: 'password123', email: `email${i}@mail.ru`})
            }
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration`)
                .send({ login: 'U_final', password: 'password123', email: 'final@mail.ru' })
                .expect(HttpStatus.TOO_MANY_REQUESTS);
        })
    })
    describe('Registration-confirmation, failed scenarios', () =>{
        it('should return 400 for invalid confirmation code', async () => {
            const code = 'invalidCode';
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration-confirmation`)
                .send({code})
                .expect(HttpStatus.BAD_REQUEST);
        });
        it('should return 400 for already been applied confirmation code', async () => {
            const registrationData = {
                login: `${TEST_USER.login}${testNumber}`,
                password: `${TEST_USER.password}`,
                email: `test${testNumber}@mail.ru`,
            }
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration`)
                .send(registrationData)
                .expect(HttpStatus.NO_CONTENT);

            expect(emailMock.sentEmails).toHaveLength(1);
            expect(emailMock.sentEmails[0].to).toBe(registrationData.email);

            const code = emailMock.getLastConfirmationCode();
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration-confirmation`)
                .send({code})
                .expect(HttpStatus.NO_CONTENT);

            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration-confirmation`)
                .send({code})
                .expect(HttpStatus.BAD_REQUEST);
        });
        it('should return 400 for expired confirmation code', async () => {
            const registrationData = {
                login: `${TEST_USER.login}${testNumber}`,
                password: `${TEST_USER.password}`,
                email: `test${testNumber}@mail.ru`,
            }
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration`)
                .send(registrationData)
                .expect(HttpStatus.NO_CONTENT);

            expect(emailMock.sentEmails).toHaveLength(1);
            expect(emailMock.sentEmails[0].to).toBe(registrationData.email);

            const code = emailMock.getLastConfirmationCode();

            const connection = app.get(getConnectionToken());
            const userModel = connection.model(User.name);
            await userModel.updateOne(
                { 'emailConfirmation.confirmationCode': code },
                { $set: { 'emailConfirmation.expirationDate': new Date(Date.now() - 1000) } },
            );

            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration-confirmation`)
                .send({ code })
                .expect(HttpStatus.BAD_REQUEST);
        });
        it('should return 429 after too many attempts with invalid code', async () => {
            const code = 'invalidCode';
            for(let i = 0; i < 5; i++) {
                await request(app.getHttpServer())
                    .post(`${AUTH_PATH}/registration-confirmation`)
                    .send({ code })
                    .expect(HttpStatus.BAD_REQUEST);
            }
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration-confirmation`)
                .send({ code })
                .expect(HttpStatus.TOO_MANY_REQUESTS);
        })
    })
    describe('Password recovery flow, successful scenarios', () => {
        it('should send recoveryCode on email, 204: POST /api/auth/password-recovery ', async () => {
            const registrationData = {
                login: `${TEST_USER.login}${testNumber}`,
                password: `${TEST_USER.password}`,
                email: `test${testNumber}@mail.ru`,
            }
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration`)
                .send(registrationData)
                .expect(HttpStatus.NO_CONTENT);

            expect(emailMock.sentEmails).toHaveLength(1);
            expect(emailMock.sentEmails[0].to).toBe(registrationData.email);

            const code = emailMock.getLastConfirmationCode();
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration-confirmation`)
                .send({code})
                .expect(HttpStatus.NO_CONTENT);

            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/password-recovery`)
                .send({email: registrationData.email})
                .expect(HttpStatus.NO_CONTENT);

            const passwordRecoveryCode = emailMock.getLastRecoveryCode();
            expect(passwordRecoveryCode).toBeTruthy();

            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/new-password`)
                .send({newPassword: 'NewPassword123', recoveryCode: passwordRecoveryCode})
                .expect(HttpStatus.NO_CONTENT);
        });
        it('should not send recoveryCode on not existing email, 204: POST /api/auth/password-recovery ', async () => {
            const notExistingEmail = 'useremail@company.com';

            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/password-recovery`)
                .send({email: notExistingEmail})
                .expect(HttpStatus.NO_CONTENT);

            const passwordRecoveryCode = emailMock.getLastRecoveryCode();
            expect(passwordRecoveryCode).toBeFalsy();
        });
    })
    describe('Password recovery, failed scenarios', () =>{
        it('should return 400 if using invalid email', async () => {
            const invalidEmail = '222^gmail.com';
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/password-recovery`)
                .send({email: invalidEmail})
                .expect(HttpStatus.BAD_REQUEST);

            const passwordRecoveryCode = emailMock.getLastRecoveryCode();
            expect(passwordRecoveryCode).toBeFalsy();
        })
        it('should return 429 for more then 5 attempts from one IP-address during 10 seconds', async () => {
            const notExistingEmail = 'useremail@company.com';
            for (let i = 0; i < 5; i++) {
                await request(app.getHttpServer())
                    .post(`${AUTH_PATH}/password-recovery`)
                    .send({email: notExistingEmail})
                    .expect(HttpStatus.NO_CONTENT);
            }
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/password-recovery`)
                .send({email: notExistingEmail})
                .expect(HttpStatus.TOO_MANY_REQUESTS);
        })
    })
    describe('New-password, failed scenarios', () =>{
        it('should return 400 if using empty password', async () => {
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/new-password`)
                .send({newPassword: ' ', recoveryCode: ''})
                .expect(HttpStatus.BAD_REQUEST);
        })
        it('should return 400 if using empty password', async () => {
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/new-password`)
                .send({newPassword: 'newPassword123', recoveryCode: ''})
                .expect(HttpStatus.BAD_REQUEST);
        })
        it('should return 429 for more then 5 attempts from one IP-address during 10 seconds', async () => {
            const notExistingEmail = 'useremail@company.com';
            for (let i = 0; i < 5; i++) {
                await request(app.getHttpServer())
                    .post(`${AUTH_PATH}/new-password`)
                    .send({newPassword: 'newPassword123', recoveryCode: ''})
                    .expect(HttpStatus.BAD_REQUEST);
            }
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/new-password`)
                .send({newPassword: 'newPassword123', recoveryCode: ''})
                .expect(HttpStatus.TOO_MANY_REQUESTS);
        })
    })
    describe('Registration-resending email resending flow, successful scenarios', () => {
        it('should send code on email, 204: POST /api/auth/registration-email-resending ', async () => {
            const registrationData = {
                login: `${TEST_USER.login}${testNumber}`,
                password: `${TEST_USER.password}`,
                email: `test${testNumber}@mail.ru`,
            }
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration`)
                .send(registrationData)
                .expect(HttpStatus.NO_CONTENT);

            expect(emailMock.sentEmails).toHaveLength(1);
            expect(emailMock.sentEmails[0].to).toBe(registrationData.email);
            const firstCode = emailMock.getLastConfirmationCode();

            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration-email-resending`)
                .send({email: registrationData.email})
                .expect(HttpStatus.NO_CONTENT);

            expect(emailMock.sentEmails).toHaveLength(2);
            const newCode = emailMock.getLastConfirmationCode();
            expect(newCode).toBeTruthy();
            expect(newCode).not.toBe(firstCode);

            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration-confirmation`)
                .send({code: newCode})
                .expect(HttpStatus.NO_CONTENT);

            const { accessToken, refreshTokenCookie } = await loginUser(app, {
                loginOrEmail: registrationData.login,
                password: registrationData.password
            });
            expect(accessToken).toBeDefined();
            validateJWT(accessToken);
            validateRefreshTokenCookie(refreshTokenCookie);
            expect(hasCookieWithName(refreshTokenCookie,'refreshToken')).toBe(true);
        })
    })
    describe('Registration-resending email resending, failed scenarios', () => {
        it('should return 400 if using invalid email', async () => {
            const invalidEmail = '222^gmail.com';

            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration-email-resending`)
                .send({email: invalidEmail})
                .expect(HttpStatus.BAD_REQUEST);
        })
        it('should return 400 if using valid email for unregister user', async () => {
            const email = 'testEmail@gmail.com';

            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration-email-resending`)
                .send({email})
                .expect(HttpStatus.BAD_REQUEST);
        })
        it('should return 400 if email already confirmed', async () => {
            const registrationData = {
                login: `${TEST_USER.login}${testNumber}`,
                password: `${TEST_USER.password}`,
                email: `test${testNumber}@mail.ru`,
            }
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration`)
                .send(registrationData)
                .expect(HttpStatus.NO_CONTENT);

            expect(emailMock.sentEmails).toHaveLength(1);
            expect(emailMock.sentEmails[0].to).toBe(registrationData.email);
            const code = emailMock.getLastConfirmationCode();

            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration-confirmation`)
                .send({code})
                .expect(HttpStatus.NO_CONTENT);
            const { accessToken, refreshTokenCookie } = await loginUser(app, {
                loginOrEmail: registrationData.login,
                password: registrationData.password
            });
            expect(accessToken).toBeDefined();
            validateJWT(accessToken);
            validateRefreshTokenCookie(refreshTokenCookie);
            expect(hasCookieWithName(refreshTokenCookie,'refreshToken')).toBe(true);

            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration-email-resending`)
                .send({email: registrationData.email})
                .expect(HttpStatus.BAD_REQUEST);
        })
        it('should return 429 for more than 5 attempts from one IP-address during 10 seconds ', async () => {
            const email = 'testEmail@gmail.com';

            for (let i = 0; i < 5; i++) {
                await request(app.getHttpServer())
                    .post(`${AUTH_PATH}/registration-email-resending`)
                    .send({email})
                    .expect(HttpStatus.BAD_REQUEST);
            }
            await request(app.getHttpServer())
                .post(`${AUTH_PATH}/registration-email-resending`)
                .send({email})
                .expect(HttpStatus.TOO_MANY_REQUESTS);
        })
    })
})