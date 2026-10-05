import {ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus,} from '@nestjs/common';
import {Request, Response} from 'express';
import {ErrorResponseBody} from './error-response-body.type';
import {DomainExceptionCode} from '../domain-exception-codes';

@Catch()
export class AllHttpExceptionsFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        if(exception instanceof HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if(status === HttpStatus.BAD_REQUEST && Array.isArray(exceptionResponse)) {
                const errors = exceptionResponse.map((error)=>({
                    message: error.message,
                    field: error.property,
                }));
                response.status(status).json({errorsMessages: errors});
                return;
            }
            if(status === HttpStatus.BAD_REQUEST && typeof exceptionResponse === 'object' && 'errorsMessages' in exceptionResponse) {
                response.status(status).json({ errorsMessages: exceptionResponse.errorsMessages });
                return;
            }
            response.status(status).json(exceptionResponse);
            return;
        }
        //Если сработал этот фильтр, то пользователю улетит 500я ошибка
        const message = exception.message || 'Unknown exception occurred.';
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        const responseBody = this.buildResponseBody(request.url, message);

        response.status(status).json(responseBody);
    }

    private buildResponseBody(
        requestUrl: string,
        message: string,
    ): ErrorResponseBody {
        const isProduction = process.env.NODE_ENV === 'production';

        if(isProduction) {
            return {
                errorsMessages: [{message: 'Some error occurred', field: 'unknown'}],
            };
        }
        return {
            errorsMessages: [{message: message, field: 'unknown'}],
        }
    }
}