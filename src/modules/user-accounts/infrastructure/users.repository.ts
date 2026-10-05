import {InjectModel} from "@nestjs/mongoose";
import {User, UserDocument, type UserModelType} from "../domain/user.entity";
import { Injectable, NotFoundException } from '@nestjs/common';
import {Types} from "mongoose";
import {DomainException} from "../../../core/exceptions/domain-exceptions";
import {DomainExceptionCode} from "../../../core/exceptions/domain-exception-codes";

@Injectable()
export class UsersRepository {
    constructor(@InjectModel(User.name) private userModel: UserModelType) {}
    async findById(id: string): Promise<UserDocument | null> {
        if (!Types.ObjectId.isValid(id)) {
            return null;
        }
        const objectId = new Types.ObjectId(id);
        return this.userModel.findOne({
            _id: objectId,
            deletedAt: null,
        })
    }
    async findByLogin(login: string): Promise<UserDocument | null> {
        return this.userModel.findOne({login: login})
    }
    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({email: email})
    }
    async save(user: UserDocument): Promise<void> {
        await user.save();
    }
    async findOrNotFoundFail(id: string): Promise<UserDocument> {
        const user = await this.findById(id);
        if (!user) {
            throw new DomainException({
                code: DomainExceptionCode.NotFound,
                message: `User not found`,
                extensions: [
                    { message: `User not found`, field: 'userId' },
                ]
            })
        }
        return user;
    }
    async findByLoginOrEmail(loginOrEmail: string): Promise<UserDocument|null> {
        const normalizedLoginOrEmail = loginOrEmail.trim();
        return  this.userModel.findOne({
            $or: [{login: normalizedLoginOrEmail}, {email: normalizedLoginOrEmail}],
        });
    }
    async findByConfirmationCode(code: string): Promise<UserDocument | null> {
        return this.userModel.findOne({"emailConfirmation.confirmationCode": code})
    }
    async loginIsExist(login: string): Promise<boolean> {
        return !!(await this.userModel.countDocuments({ login: login }));
    }
}