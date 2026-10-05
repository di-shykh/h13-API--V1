import {MailerService} from "@nestjs-modules/mailer";
import {Injectable} from "@nestjs/common";

@Injectable()
export class EmailService{
    constructor(private mailerService: MailerService){}
    async sendConfirmationEmail(email: string, code: string): Promise<void>{
        await this.mailerService.sendMail({
            to: email,
            subject: 'Confirm your registration',
            html: `To finish registration please follow the link below:
                         <a href='https://somesite.com/confirm-email?code=${code}'>complete registration</a>`,
        })
    }
    async sendPasswordRecoveryEmail(email: string, code: string): Promise<void>{
        await this.mailerService.sendMail({
            to: email,
            subject: 'Password recovery',
            html: `To finish password recovery please follow the link below:
                  <a href='https://somesite.com/password-recovery?recoveryCode=${code}'>recovery password</a>`,
        })
    }
}