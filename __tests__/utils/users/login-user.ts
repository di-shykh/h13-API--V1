import {HttpStatus, INestApplication} from "@nestjs/common";
import request from "supertest";
import {AUTH_PATH} from "../../../src/core/paths/paths";
import {getCookiesString, validateRefreshTokenCookie} from "../auth/cookies.helpers";

export async function loginUser(
    app: INestApplication,
    credentials: { loginOrEmail: string, password: string },
): Promise<{ accessToken: string, refreshTokenCookie: string }> {
    const response = await request(app.getHttpServer())
        .post(`${AUTH_PATH}/login`)
        .send(credentials)
        .expect(HttpStatus.OK)

    const cookies = getCookiesString(response);
    validateRefreshTokenCookie(cookies);

    return {
        accessToken: response.body.accessToken,
        refreshTokenCookie: cookies,
    };
}
