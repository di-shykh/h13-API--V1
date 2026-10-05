import {BadRequestException, INestApplication, ValidationPipe} from '@nestjs/common';
import {DomainExceptionCode} from "../core/exceptions/domain-exception-codes";
import {DomainException} from "../core/exceptions/domain-exceptions";

export function pipesSetup(app: INestApplication) {
    //Глобальный пайп для валидации и трансформации входящих данных.
    //На следующем занятии рассмотрим подробнее
    app.useGlobalPipes(
        new ValidationPipe({
            //class-transformer создает экземпляр dto
            //соответственно применятся значения по-умолчанию
            //и методы классов dto
            transform: true,
            whitelist: true,
            stopAtFirstError: false,
            exceptionFactory: (errors) => {
                const errorsMessages = errors.map(err => ({
                    message: Object.values(err.constraints || {})[0] || 'Error',
                    field: err.property
                }));
                /*throw*/ return new BadRequestException({ errorsMessages });
            }
        }),
    );
}