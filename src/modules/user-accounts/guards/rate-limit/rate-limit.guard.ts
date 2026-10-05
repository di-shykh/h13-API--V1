import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common';
import {DomainException} from "../../../../core/exceptions/domain-exceptions";
import {DomainExceptionCode} from "../../../../core/exceptions/domain-exception-codes";
import {RateLimit,type RateLimitDocument, type RateLimitModelType} from "../../domain/rate-limit.entity";
import {InjectModel} from "@nestjs/mongoose";

@Injectable()
export class RateLimitGuard implements CanActivate {
    constructor(@InjectModel(RateLimit.name) private rateLimitModel: RateLimitModelType) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const LIMIT_COUNT= 5;
        const TIME_WINDOW_MS = 10 * 1000;
        const EXTRA_BUFFER_MS = 1000;

        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();

        const ip: string = request.ip || request.socket.remoteAddress || 'unknown';
        const url: string = request.originalUrl || request.baseUrl || request.url || '/';
        const date: Date = new Date();
        const timeLimit = new Date(Date.now() - TIME_WINDOW_MS);
        const deleteTimeLimit = new Date(Date.now() - (TIME_WINDOW_MS + EXTRA_BUFFER_MS));

        try {
            const requestsCount: number = await this.rateLimitModel.countDocuments({
                ip,
                url,
                date: { $gte: timeLimit },
            });
            if (requestsCount >= LIMIT_COUNT) {
                response.setHeader('Retry-After', Math.ceil(TIME_WINDOW_MS / 1000));
                throw new DomainException({
                    code: DomainExceptionCode.TooManyRequests,
                    message: 'Too many requests',
                    extensions: [
                        {message: 'Too many requests', field: ''}
                    ]
                })
            }
            await this.rateLimitModel.deleteMany({
                date: { $lt: deleteTimeLimit },
            });
            const result: RateLimitDocument = await this.rateLimitModel.create({
                ip,
                url,
                date,
            });
            return true;
        } catch (error) {
            if(error instanceof DomainException) {
                throw error;
            }
            throw new DomainException({
                code: DomainExceptionCode.InternalServerError,
                message: 'Rate limit check failed',
                extensions: [
                    { message: 'Internal server error', field: '' }
                ]
            });
        }
    }
}