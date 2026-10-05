import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import {PasswordRecovery, PasswordRecoveryDocument, type PasswordRecoveryModelType} from "../domain/password-recovery.entity";

@Injectable()
export class PasswordRecoveryRepository {
    constructor(@InjectModel(PasswordRecovery.name) private PasswordRecoveryModel: PasswordRecoveryModelType) {}
    async save(recovery: PasswordRecovery): Promise<void> {
        await this.PasswordRecoveryModel.findByIdAndUpdate(
            {userId: recovery.userId},
            {   userId: recovery.userId,
                passwordRecoveryCode: recovery.passwordRecoveryCode,
                passwordRecoveryExpiration: recovery.passwordRecoveryExpiration,
                isUsed: recovery.isUsed,
                createdAt: new Date().toISOString()
            },
            { upsert: true}
        )
    }
    async findByCode(recoveryCode: string): Promise<PasswordRecovery| null> {
        const result = await this.PasswordRecoveryModel.findOne({passwordRecoveryCode: recoveryCode})
        if (!result) return null;
        return PasswordRecovery.restore(
            result.userId,
            result.isUsed,
            result.passwordRecoveryCode,
            result.passwordRecoveryExpiration,
            result.createdAt
        )
    }
}