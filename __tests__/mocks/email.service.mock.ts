import {EmailService} from "../../src/modules/notifications/email.service";

export interface SentEmail {
    to: string;
    subject: string;
    code: string;
}

export class EmailServiceMock {
    public sentEmails: SentEmail[] = [];

    async sendConfirmationEmail(email: string, code: string): Promise<void> {
        this.sentEmails.push({
            to: email,
            subject: 'Confirm your registration',
            code,
        });
    }

    async sendPasswordRecoveryEmail(email: string, code: string): Promise<void> {
        this.sentEmails.push({
            to: email,
            subject: 'Password recovery',
            code,
        });
    }

    getLastConfirmationCode(): string {
        const email = this.sentEmails.findLast(e=> e.subject === 'Confirm your registration');
        if(!email) {
            throw new Error('Confirmation email was not sent');
        }
        return email.code;
    }

    getLastRecoveryCode(): string {
        const email = this.sentEmails.findLast(e=> e.subject === 'Password recovery');
        return email ? email.code : '';
    }

    clear() {
        this.sentEmails = [];
    }
}