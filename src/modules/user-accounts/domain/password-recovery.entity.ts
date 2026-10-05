import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {HydratedDocument, Model, Types} from 'mongoose';
import {addHours} from "date-fns";
import {DomainException} from "../../../core/exceptions/domain-exceptions";
import {DomainExceptionCode} from "../../../core/exceptions/domain-exception-codes";
import {randomUUID} from "crypto";

@Schema({timestamps: true})
export class PasswordRecovery {
    @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
    _id: Types.ObjectId;
    @Prop({type: String, required: true, min: 1})
    userId: string;
    @Prop({type: Boolean, required: true, default: false})
    isUsed: boolean;
    @Prop({type: String, required: true, min: 1})
    passwordRecoveryCode: string;
    @Prop({type: Date, required: true})
    passwordRecoveryExpiration: Date;
    @Prop({type: Date, required: true})
    createdAt: Date;

    get id(){
        return this._id?.toString() || '';
    }

    static createPasswordRecovery(userId: string): PasswordRecoveryDocument {

        const recoveryCode: string = randomUUID();
        const expirationDate: Date = addHours(new Date(), 24);
        const passwordRecoveryData = new this();
        passwordRecoveryData.passwordRecoveryCode = recoveryCode;
        passwordRecoveryData.passwordRecoveryExpiration = expirationDate;
        passwordRecoveryData.userId = userId;
        passwordRecoveryData.isUsed = false;
        passwordRecoveryData.createdAt = new Date();

        return passwordRecoveryData as PasswordRecoveryDocument;
    }
    static restore(
        userId: string,
       isUsed: boolean,
       passwordRecoveryCode: string,
       passwordRecoveryExpiration: Date,
       createdAt: Date,
    ): PasswordRecovery {
        const passwordRecoveryData = new this();

        passwordRecoveryData.passwordRecoveryCode = passwordRecoveryCode;
        passwordRecoveryData.passwordRecoveryExpiration = passwordRecoveryExpiration;
        passwordRecoveryData.userId = userId;
        passwordRecoveryData.isUsed = isUsed;
        passwordRecoveryData.createdAt = createdAt;

         return passwordRecoveryData;
    }
    use(code: string): void {
        if(this.isUsed){
            throw new DomainException({
                code: DomainExceptionCode.BadRequest,
                message: `Recovery code is already in used`,
                extensions: [
                    { message: `Recovery code is already in used`, field: 'code' },
                ]
            })
        }
        if(this.passwordRecoveryCode !== code){
            throw new DomainException({
                code: DomainExceptionCode.BadRequest,
                message: `Invalid recovery code`,
                extensions: [
                    { message: `Invalid recovery code`, field: 'code' },
                ]
            })
        }
        if(this.passwordRecoveryExpiration < new Date()){
            throw new DomainException({
                code: DomainExceptionCode.BadRequest,
                message: `Recovery code is expired`,
                extensions: [
                    { message: `Recovery code is expired`, field: 'code' },
                ]
            })
        }
        this.isUsed = true;
    }
    isValid(code: string): boolean {
        return !this.isUsed && this.passwordRecoveryCode === code && this.passwordRecoveryExpiration > new Date();
    }
}
export const PasswordRecoverySchema  = SchemaFactory.createForClass(PasswordRecovery);
PasswordRecoverySchema.virtual('id').get(function() {
    return this._id.toString();
})
PasswordRecoverySchema.loadClass(PasswordRecovery);
export type PasswordRecoveryDocument = HydratedDocument<PasswordRecovery>;
export type PasswordRecoveryModelType = Model<PasswordRecoveryDocument> & typeof PasswordRecovery;