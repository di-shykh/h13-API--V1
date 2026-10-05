import { Module,Global, } from '@nestjs/common';
import { UsersController } from './api/users-controller';
import { UsersService } from './application/users-service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.entity';
import { UsersRepository } from './infrastructure/users.repository';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { UsersExternalQueryRepository } from './infrastructure/external-query/users.external-query-repository';
import { UsersExternalService } from './application/users.external-service';
import {AuthController} from "./api/auth.controller";
import {AuthQueryRepository} from "./infrastructure/query/auth.query-repository";
import {AuthService} from "./application/auth.service";
import {LocalStrategy} from "./guards/local/local.strategy";
import {CryptoService} from "./application/crypto.service";
import { JwtStrategy } from './guards/bearer/jwt.strategy';
import {EmailService} from "../notifications/email.service";
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import {PasswordRecovery, PasswordRecoverySchema} from "./domain/password-recovery.entity";
import {PasswordRecoveryRepository} from "./infrastructure/password-recovery.repository";
import {NotificationsModule} from "../notifications/notifications.module";
import {RateLimit, RateLimitSchema} from "./domain/rate-limit.entity";
// import { SecurityDevicesController } from './api/security-devices.controller';
// import { SecurityDevicesQueryRepository } from './infrastructure/query/security-devices.query-repository';
@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true, // Чтобы был доступен везде
        }),
        JwtModule.register({
            secret: 'access-token-secret', //TODO: move to env. will be in the following lessons
            signOptions: { expiresIn: '5m' }, // Время жизни токена
        }),
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: PasswordRecovery.name, schema: PasswordRecoverySchema},
            { name: RateLimit.name, schema: RateLimitSchema },//!не факт что нужно
        ]),
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                transport: {
                    host: configService.get<string>('MAIL_HOST'),
                    port: configService.get<number>('MAIL_PORT'),
                    secure: false,
                    auth: {
                        user: configService.get<string>('MAIL_USER'),
                        pass: configService.get<string>('MAIL_PASSWORD'),
                    },
                    // streamTransport: true, // <--- Письма сохраняются локально, а не отправляются по сети
                    // newline: 'unix',
                    // buffer: true,
                },
                defaults: {
                    from: `"No Reply" <${configService.get<string>('MAIL_FROM')}>`,
                },
            }),
            inject: [ConfigService],
        }),
        NotificationsModule,
    ],
    controllers: [UsersController, AuthController/*, SecurityDevicesController*/],
    providers: [
        UsersService,
        UsersRepository,
        UsersQueryRepository,
        UsersExternalQueryRepository,
        UsersExternalService,
        // SecurityDevicesQueryRepository,
        AuthQueryRepository,
        AuthService,
        LocalStrategy,
        CryptoService,
        JwtStrategy,
        EmailService,
        PasswordRecoveryRepository,
    ],
    exports: [
        UsersExternalQueryRepository,
        UsersExternalService,
        AuthService,
        JwtModule,
        UsersService,
        MongooseModule,
    ],
})
export class UserAccountsModule {}
