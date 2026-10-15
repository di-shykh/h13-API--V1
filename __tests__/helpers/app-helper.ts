import {Test, TestingModule, TestingModuleBuilder} from "@nestjs/testing";
import {AppModule} from "../../src/app.module";
import {pipesSetup} from "../../src/setup/pipes.setup";
import {INestApplication} from "@nestjs/common";
import {getConnectionToken} from "@nestjs/mongoose";

export const initApp = async (builders?: ((builder: TestingModuleBuilder) => TestingModuleBuilder)[]) => {
    let builder = Test.createTestingModule({ imports: [AppModule] });
    if (builders) {
        for (const fn of builders) {
            builder = fn(builder);
        }
    }
    const moduleFixture = await builder.compile();
    const app = moduleFixture.createNestApplication();
    pipesSetup(app);
    await app.init();
    return app;
}
export const clearDatabase = async (app: INestApplication) => {
    const connection  = app.get(getConnectionToken());
    const collections = connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
}