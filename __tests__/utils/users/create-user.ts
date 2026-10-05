import {UserViewDto} from "../../../src/modules/user-accounts/api/view-dto/user.view-dto";
import {CreateUserDto} from "../../../src/modules/user-accounts/dto/create-user.dto";
import {HttpStatus, INestApplication} from "@nestjs/common";
import request from "supertest";
import {USERS_PATH} from "../../../src/core/paths/paths";

export async function createUser(
    app: INestApplication,
    token: string,
    dto: CreateUserDto
): Promise<UserViewDto> {
    const user = await request(app.getHttpServer())
        .post(USERS_PATH)
        .set('Authorization', token)
        .send(dto)
        .expect(HttpStatus.CREATED);
    return user.body;
}