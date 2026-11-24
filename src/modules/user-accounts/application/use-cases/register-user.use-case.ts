import {CreateUserDto} from "../../dto/create-user.dto";
import {CommandHandler, ICommandHandler} from "@nestjs/cqrs";
import {UsersFactory} from "../users-factory.service";
import {UsersRepository} from "../../infrastructure/users.repository";
import {EmailService} from "../../../notifications/email.service";
import {randomUUID} from "crypto";

export class RegisterUserCommand {
    constructor(
        public readonly dto: CreateUserDto,
    ) {}
}
@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
    constructor(
        private readonly usersFactory: UsersFactory,
        private readonly usersRepository: UsersRepository,
        private readonly emailService: EmailService,
    ) {}
    async execute(command: RegisterUserCommand): Promise<void> {
        try {
            const user = await this.usersFactory.create(command.dto);
            const confirmCode: string = randomUUID();
            user.setConfirmationCode(confirmCode);
            await this.usersRepository.save(user);
            this.emailService
                .sendConfirmationEmail(user.email, confirmCode)
                .catch(console.error);
        }
        catch (e) {
            console.error('🔥 [REGISTER USER ERROR]:', e);
            throw e;
        }
    }
}