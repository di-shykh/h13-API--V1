import {createParamDecorator, ExecutionContext} from "@nestjs/common";

export const CurrentUserId = createParamDecorator(
    (data: unknown, context: ExecutionContext): string | null => {
        const request = context.switchToHttp().getRequest();
        return request.userId ?? null;
    }
)