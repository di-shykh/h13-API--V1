import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
} from '@nestjs/common';
import { DomainException } from '../domain-exceptions';
import { Request, Response } from 'express';
import { DomainExceptionCode } from '../domain-exception-codes';
import { ErrorResponseBody } from './error-response-body.type';

@Catch(DomainException)
export class DomainHttpExceptionsFilter implements ExceptionFilter {
    catch(exception: DomainException, host: ArgumentsHost){
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status = this.mapToHttpStatus(exception.code);
        const responseBody = this.buildResponseBody(exception);

        response.status(status).json(responseBody);
    }

    private mapToHttpStatus(code: DomainExceptionCode): number {
        switch (code) {
            case DomainExceptionCode.BadRequest:
            case DomainExceptionCode.ValidationError:
            case DomainExceptionCode.ConfirmationCodeExpired:
            case DomainExceptionCode.EmailNotConfirmed:
            case DomainExceptionCode.PasswordRecoveryCodeExpired:
                return HttpStatus.BAD_REQUEST;
            case DomainExceptionCode.Forbidden:
                return HttpStatus.FORBIDDEN;
            case DomainExceptionCode.NotFound:
                return HttpStatus.NOT_FOUND;
            case DomainExceptionCode.Unauthorized:
                return HttpStatus.UNAUTHORIZED;
            case DomainExceptionCode.InternalServerError:
                return HttpStatus.INTERNAL_SERVER_ERROR;
            default:
                return HttpStatus.INTERNAL_SERVER_ERROR;
        }
    }

    private buildResponseBody(
        exception: DomainException,
    ): ErrorResponseBody {
        return {
            //code: exception.code,
            errorsMessages: exception.extensions.length >0 ? exception.extensions : [{ message: exception.message, field: 'unknown' }],
        };
    }
}