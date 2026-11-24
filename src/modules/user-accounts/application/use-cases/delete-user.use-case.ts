import {CommandHandler, ICommandHandler} from "@nestjs/cqrs";
import {UsersRepository} from "../../infrastructure/users.repository";

export class DeleteUserCommand {
    constructor(
        public readonly id: string,
    ) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
    constructor(
        private readonly usersRepository: UsersRepository,
    ) {}
    async execute(command: DeleteUserCommand): Promise<void> {
        const user = await this.usersRepository.findOrNotFoundFail(command.id);
        user.makeDeleted();
        await this.usersRepository.save(user);
    }
}