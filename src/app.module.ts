import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {MongooseModule} from "@nestjs/mongoose";
import {UserAccountsModule} from "./modules/user-accounts/userAccounts.module";
import {CoreModule} from "./core/core.module";
import { BloggersPlatformModule } from './modules/bloggers-platform/bloggers-platform.module';
import { TestingModule } from './modules/testing/testing.module';
import {APP_FILTER} from "@nestjs/core";
import {AllHttpExceptionsFilter} from "./core/exceptions/filters/all-exceptions.filter";
import {DomainHttpExceptionsFilter} from "./core/exceptions/filters/domain-exception.filters";
import {AppConfigModule} from "./config.module";

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://root_admin:root_admin@ac-xykok0w-shard-00-00.cdldllg.mongodb.net:27017,ac-xykok0w-shard-00-01.cdldllg.mongodb.net:27017,ac-xykok0w-shard-00-02.cdldllg.mongodb.net:27017/?ssl=true&replicaSet=atlas-9njp5g-shard-0&authSource=admin&appName=Cluster0'),//TODO: move to env. will be in the following lessons
    UserAccountsModule,
    TestingModule,
    BloggersPlatformModule,
    CoreModule,
    AppConfigModule,
  ],
  controllers: [
    AppController
  ],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllHttpExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DomainHttpExceptionsFilter,
    },
  ],
})
export class AppModule {}
