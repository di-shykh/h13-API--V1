import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import type {UserModelType} from "../domain/user.entity";
import {User} from "../domain/user.entity";
import { CryptoService } from './crypto.service';
import { EmailService } from '../../notifications/email.service';
import {UsersRepository} from "../infrastructure/users.repository";


@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name)
        private usersRepository: UsersRepository,
    ) { }

}

