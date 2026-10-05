import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {HydratedDocument, Model, Types} from 'mongoose';
import {UpdateUserDto} from '../dto/create-user.dto';
import {CreateUserDomainDto} from './dto/create-user.domain.dto';
import {EmailConfirmation, EmailConfirmationSchema} from "./email-confirmation.schema";
import {addHours} from "date-fns";
import {DomainException} from "../../../core/exceptions/domain-exceptions";
import {DomainExceptionCode} from "../../../core/exceptions/domain-exception-codes";

export const loginConstraints = {
    minLength: 3,
    maxLength: 10,
    match: /^[a-zA-Z0-9_-]*$/,
}

export const passwordConstraints = {
    minLength: 6,
    maxLength: 20,
}

export const emailConstraints = {
    match: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
};

@Schema({ timestamps: true })
export class User{
    /**
     * Login of the user (must be uniq)
     * @type {string}
     * @required
     */
    @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
    _id: Types.ObjectId;
    @Prop({ type: String, required: true })
    login: string;

    /**
     * Password hash for authentication
     * @type {string}
     * @required
     */
    @Prop({ type: String, required: true })
    passwordHash: string;

    /**
     * Email of the user
     * @type {string}
     * @required
     */
    @Prop({ type: String, min: 5, required: true })
    email: string;

    // /**
    //  * Email confirmation status (if not confirmed in 2 days account will be deleted)
    //  * @type {boolean}
    //  * @default false
    //  */
    // @Prop({ type: Boolean, required: true, default: false })
    // isEmailConfirmed: boolean;

    @Prop({ type: EmailConfirmationSchema })
    emailConfirmation: EmailConfirmation;
    /**
     * Creation timestamp
     * Explicitly defined despite timestamps: true
     * properties without @Prop for typescript so that they are in the class instance (or in instance methods)
     * @type {Date}
     */
    createdAt: Date;
    updatedAt: Date;

    /**
     * Deletion timestamp, nullable, if date exist, means entity soft deleted
     * @type {Date | null}
     */
    @Prop({ type: Date, nullable: true })
    deletedAt: Date | null;

    /**
     * Virtual property to get the stringified ObjectId
     * @returns {string} The string representation of the ID
     */
    get id(){
        return this._id?.toString() || '';
    }

    /**
     * Factory method to create a User instance
     * @param {CreateUserDto} dto - The data transfer object for user creation
     * @returns {UserDocument} The created user document
     * DDD started: как создать сущность, чтобы она не нарушала бизнес-правила? Делегируем это создание статическому методу
     */
    static createInstance(dto: CreateUserDomainDto): UserDocument {
        const user = new this();
        user.email = dto.email;
        user.passwordHash = dto.passwordHash;
        user.login = dto.login;
        user.emailConfirmation = {
            isConfirmed: false,
            confirmationCode: '',
            expirationDate: ''
        }
        user.deletedAt = null;

        return user as UserDocument;
    }

    /**
     * Marks the user as deleted
     * Throws an error if already deleted
     * @throws {Error} If the entity is already deleted
     * DDD сontinue: инкапсуляция (вызываем методы, которые меняют состояние\св-ва) объектов согласно правилам этого объекта
     */
    makeDeleted() {
        if(this.deletedAt != null){
            throw new Error('Entity is already deleted');
        }
        this.deletedAt = new Date();
    }

    /**
     * Updates the user instance with new data
     * Resets email confirmation if email is updated
     * @param {UpdateUserDto} dto - The data transfer object for user updates
     * DDD сontinue: инкапсуляция (вызываем методы, которые меняют состояние\св-ва) объектов согласно правилам этого объекта
     */
    update(dto: UpdateUserDto) {
        if (dto.email !== this.email) {
            this.emailConfirmation.isConfirmed = false;
            this.email = dto.email;
        }
    }
    setConfirmationCode(code: string) {
         if (this.emailConfirmation.isConfirmed) {
            throw new DomainException({
                code: DomainExceptionCode.BadRequest,
                message: `Email is already confirmed`,
                extensions: [
                    { message: `Email is already confirmed`, field: 'email' },
                ]
            })
        }
        this.emailConfirmation.isConfirmed = false;
        this.emailConfirmation.confirmationCode = code;
        this.emailConfirmation.expirationDate = addHours(new Date(), 24).toISOString();
    }
    setPassword(passwordHash: string) {
        this.passwordHash = passwordHash;
    }
    updateEmailConfirmationData(code: string) {
        if (!this.emailConfirmation) {
            throw new Error('Email confirmation does not exist');
        }
        if (this.emailConfirmation.isConfirmed) {
            throw new Error('Email is already confirmed');
        }
        this.emailConfirmation.confirmationCode = code;
        this.emailConfirmation.expirationDate = addHours(
            new Date(),
            24
        ).toISOString();
    }
    confirmEmail(code: string) {
        if(!code || code.length !== 36){
            throw new DomainException({
                code: DomainExceptionCode.BadRequest,
                message: `Invalid confirmation code format`,
                extensions: [
                    { message: `Invalid confirmation code format`, field: 'code' },
                ]
            })
        }
        if(!this.emailConfirmation){
            throw new DomainException({
                code: DomainExceptionCode.BadRequest,
                message: `Code does not exist`,
                extensions: [
                    { message: `Code does not exist`, field: 'code' },
                ]
            })
        }
        if(this.emailConfirmation.isConfirmed){
            throw new DomainException({
                code: DomainExceptionCode.BadRequest,
                message: `Registration is already confirmed`,
                extensions: [
                    { message: `Registration is already confirmed`, field: 'code' },
                ]
            })
        }
        const dateNow = new Date();
        const expirationDate = new Date(this.emailConfirmation.expirationDate);
        if(dateNow > expirationDate){
            throw new DomainException({
                code: DomainExceptionCode.BadRequest,
                message: `Code expired`,
                extensions: [
                    { message: `Code expired`, field: 'code' },
                ]
            })
        }
        if(this.emailConfirmation.confirmationCode !== code){
            throw new DomainException({
                code: DomainExceptionCode.BadRequest,
                message: `Invalid confirmation code`,
                extensions: [
                    { message: `Invalid confirmation code`, field: 'code' },
                ]
            })
        }
        this.emailConfirmation.isConfirmed = true;
        this.emailConfirmation.confirmationCode = '';
        this.emailConfirmation.expirationDate = '';
    }
}
export const UserSchema = SchemaFactory.createForClass(User);
// Виртуальное поле id (на случай, если нужно)
UserSchema.virtual('id').get(function() {
    return this._id.toString();
});
//регистрирует методы сущности в схеме
UserSchema.loadClass(User);

//Типизация документа
export type UserDocument = HydratedDocument<User>;

//Типизация модели + статические методы
export type UserModelType = Model<UserDocument> & typeof User;
