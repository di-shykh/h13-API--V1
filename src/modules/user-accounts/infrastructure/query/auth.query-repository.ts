import {Injectable} from '@nestjs/common';
import {MeViewDto} from "../../api/view-dto/user.view-dto";
import {UsersRepository} from '../users.repository';
import {DomainException} from "../../../../core/exceptions/domain-exceptions";
import {DomainExceptionCode} from "../../../../core/exceptions/domain-exception-codes";

@Injectable()
export class AuthQueryRepository {
    constructor(private usersRepository: UsersRepository) {}

    async me(userId: string): Promise<MeViewDto> {
        try{
            const user = await this.usersRepository.findOrNotFoundFail(userId);
            return MeViewDto.mapToView(user);
        } catch(error){
            if (error instanceof DomainException &&
            error.code === DomainExceptionCode.NotFound) {
                throw new DomainException({
                    code: DomainExceptionCode.Unauthorized,
                    message: `User not found`,
                    extensions: [
                        { message: `User not found`, field: 'userId' },
                    ]
                })
            }
            throw error;
        }
    }
}
