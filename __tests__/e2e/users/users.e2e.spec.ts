import {HttpStatus, INestApplication, ValidationPipe} from "@nestjs/common";
import {generateBasicAuthToken} from "../../utils/auth-utils";
import {Test, TestingModule} from "@nestjs/testing";
import {AppModule} from "../../../src/app.module";
import {createUser} from "../../utils/users/create-user";
import request from "supertest";
import {USERS_PATH} from "../../../src/core/paths/paths";
import {UserViewDto} from "../../../src/modules/user-accounts/api/view-dto/user.view-dto";
import {getConnectionToken} from "@nestjs/mongoose";
import {pipesSetup} from "../../../src/setup/pipes.setup";

describe('AppController (e2e),body validation tests', () => {
    let app: INestApplication;
    let moduleFixture: TestingModule | undefined;
    const adminToken: string = generateBasicAuthToken();
    const testUserData = {
        login: 'newLogin',
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
    it('should create user POST /users', async () => {
        await createUser(app, adminToken, {
            ...testUserData,
            login: '5aE2_2c8OJ',
            email: 'example@example.dev',
        });
    })
    it('should get list of users GET /users', async () => {
        const delayMs = 100;
        for (let i = 1; i <= 25; i++) {
            const userData = {
                login: `u_${i}`,
                password: `password${i}`,
                email: `email${i}@email.com`,
            }
            const user = await createUser(app, adminToken, userData);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        const response = await request(app.getHttpServer())
            .get(`${USERS_PATH}`)
            .set('Authorization', adminToken)
            .expect(HttpStatus.OK);

        expect(response.body).toEqual({
            pagesCount: 3,
            page: 1,
            pageSize: 10,
            totalCount: 25,
            items: expect.any(Array),
        })
        expect(response.body.items).toHaveLength(10);
        const items = response.body.items;
        for (let i = 0; i < items.length - 1; i++) {
            const current = new Date(items[i].createdAt).getTime();
            const next = new Date(items[i + 1].createdAt).getTime();
            expect(current).toBeGreaterThanOrEqual(next);
        }
        expect(items[0].login).toBe('u_25');
    }, 15000);
    it('should delete user; DELETE /users/:id', async () => {
        const newUser = await createUser(app, adminToken, {
            ...testUserData,
            login: 'newLogin',
            email: 'newEmail@mail.ru',
        });
        await request(app.getHttpServer())
            .delete(`${USERS_PATH}/${newUser.id}`)
            .set('Authorization', adminToken)
            .expect(HttpStatus.NO_CONTENT);
        const userListResponse = await request(app.getHttpServer())
            .get(USERS_PATH)
            .set('Authorization', adminToken)
            .expect(HttpStatus.OK);

        expect(userListResponse.body.items).toBeInstanceOf(Array);
        const deletedUserInList = userListResponse.body.items.find((user: UserViewDto) => user.id === newUser.id);
        expect(deletedUserInList).toBeUndefined();
    })
    afterAll(async () => {
        await app.close();
    });
});