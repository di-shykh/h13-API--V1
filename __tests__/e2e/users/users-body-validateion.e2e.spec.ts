import {HttpStatus, INestApplication, ValidationPipe} from "@nestjs/common";
import {generateBasicAuthToken} from "../../utils/auth-utils";
import {Test, TestingModule} from "@nestjs/testing";
import {AppModule} from "../../../src/app.module";
import {USERS_PATH} from "../../../src/core/paths/paths";
import request from "supertest";
import {createUser} from "../../utils/users/create-user";
import {getConnectionToken} from "@nestjs/mongoose";
import {pipesSetup} from "../../../src/setup/pipes.setup";

describe('AppController (e2e),body validation tests', () => {
    let app: INestApplication;
    let moduleFixture: TestingModule | undefined;
    const adminAuthToken: string = generateBasicAuthToken();
    const correctTestUserData = {
        login: 'new login',
        password: 'password',
        email: 'email@email.com',
    }
    beforeAll(async () => {
        moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        pipesSetup(app);
        await app.init();
    });
    beforeEach(async () => {
        const connection = moduleFixture!.get(getConnectionToken());
        const collections = connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    });
    it("should not create a user with incorrect body passed; POST /users", async () => {
        await request(app.getHttpServer())
            .post(USERS_PATH)
            .send(correctTestUserData)
            .expect(HttpStatus.UNAUTHORIZED);

        const invalidDataSet1 = await request(app.getHttpServer())
            .post(USERS_PATH)
            .set('Authorization', adminAuthToken)
            .send({
                ...correctTestUserData,
                login: "",
                password: "",
                email: "",
            })
            .expect(HttpStatus.BAD_REQUEST);
        expect(invalidDataSet1.body.errorsMessages).toHaveLength(3);

        const invalidDataSet2 = await request(app.getHttpServer())
            .post(USERS_PATH)
            .set('Authorization', adminAuthToken)
            .send({
                ...correctTestUserData,
                login: "      ",
                password: "       ",
                email: "randomString",
            })
            .expect(HttpStatus.BAD_REQUEST);
        expect(invalidDataSet2.body.errorsMessages).toHaveLength(3);

        const invalidDataSet3 = await request(app.getHttpServer())
            .post(USERS_PATH)
            .set('Authorization', adminAuthToken)
            .send({
                ...correctTestUserData,
                login: "di",
                password: "shgk",
                email: "randomString",
            })
            .expect(HttpStatus.BAD_REQUEST);
        expect(invalidDataSet3.body.errorsMessages).toHaveLength(3);

        const invalidDataSet4 = await request(app.getHttpServer())
            .post(USERS_PATH)
            .set('Authorization', adminAuthToken)
            .send({
                ...correctTestUserData,
                login: "didgllfgdfjkl",
                password: "shgkgjs;gjldjgsdjg;lsdjgkljsgjsgjsjlsjsl",
                email: "randomString",
            })
            .expect(HttpStatus.BAD_REQUEST);
        expect(invalidDataSet4.body.errorsMessages).toHaveLength(3);
    });
    it('should not create a user with not unique email or login; POST /users', async () => {
        await createUser(app,adminAuthToken, {
            ...correctTestUserData,
            login: "diana",
            password: "1234567",
            email: "example@gmail.com",
        });
        expect(HttpStatus.CREATED);

        const dublicateEmailUser = await request(app.getHttpServer())
            .post(USERS_PATH)
            .set('Authorization', adminAuthToken)
            .send({
                ...correctTestUserData,
                login: "diana12",
                password: "1234567",
                email: "example@gmail.com",
            })
            .expect(HttpStatus.BAD_REQUEST);
        expect(dublicateEmailUser.body.errorsMessages).toHaveLength(1);

        const dublicateLoginUser = await request(app.getHttpServer())
            .post(USERS_PATH)
            .set('Authorization', adminAuthToken)
            .send({
                ...correctTestUserData,
                login: "diana",
                password: "1234567",
                email: "exampfsle@gmail.com",
            })
            .expect(HttpStatus.BAD_REQUEST);
        expect(dublicateLoginUser.body.errorsMessages).toHaveLength(1);

        const dublicateEmailAndLoginUser = await request(app.getHttpServer())
            .post(USERS_PATH)
            .set('Authorization', adminAuthToken)
            .send({
                ...correctTestUserData,
                login: "diana",
                password: "1234567",
                email: "example@gmail.com",
            })
            .expect(HttpStatus.BAD_REQUEST);
        expect(dublicateEmailAndLoginUser.body.errorsMessages).toHaveLength(1);
    });
    it("should not delete user with wrong id; DELETE /users/:id", async () => {
        const newUser = await createUser(app,adminAuthToken, {
            ...correctTestUserData,
            login: "someLog",
            password: "1234567",
            email: "emaildi@gmail.com"
        })

        const incorrectId = newUser.id.slice(0,-2)+"qq";

        const response = await request(app.getHttpServer())
            .delete(`${USERS_PATH}/${incorrectId}`)
            .set('Authorization', adminAuthToken)
            .expect(HttpStatus.BAD_REQUEST);//тут должно быть 404! посмотри позже!

        expect(response.body).toBeDefined();
        if (response.body.errorsMessages) {
            expect(response.body.errorsMessages).toHaveLength(1);
            expect(response.body.errorsMessages[0].field).toBe('id');
            expect(response.body.errorsMessages[0].message).toContain('Incorrect');
        }
    });
    afterAll(async () => {
        await app.close();
    });
});