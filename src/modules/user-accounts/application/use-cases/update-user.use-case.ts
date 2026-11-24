import {ICommandHandler} from "@nestjs/cqrs";
import {UpdateUserDto} from "../../dto/create-user.dto";
import {UsersRepository} from "../../infrastructure/users.repository";
import {UpdateUserInputDto} from "../../api/input-dto/update-user.input-dto";

export class UpdateUserCommand {
    constructor(
        public readonly id: string,
        public readonly dto: UpdateUserInputDto
    ) {}
}

export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
    constructor(
        private readonly usersRepository: UsersRepository,
    ) {}
    async execute(command: UpdateUserCommand): Promise<string> {
        const user = await this.usersRepository.findOrNotFoundFail(command.id);
        user.update(command.dto);
        await this.usersRepository.save(user);
        return user._id.toString();
    }
}