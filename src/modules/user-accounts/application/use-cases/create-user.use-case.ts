import {CreateUserDto} from "../../dto/create-user.dto";
import {CommandHandler, ICommandHandler} from "@nestjs/cqrs";
import {UsersFactory} from "../users-factory.service";
import {UsersRepository} from "../../infrastructure/users.repository";

export class CreateUserCommand {
    constructor(
        public readonly dto: CreateUserDto,
    ) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
    constructor(
        private readonly usersFactory: UsersFactory,
        private readonly usersRepository: UsersRepository
    ) {}
    async execute(command: CreateUserCommand): Promise<string> {
        const user = await this.usersFactory.create(command.dto);
        await this.usersRepository.save(user);
        return user._id.toString();
    }
}