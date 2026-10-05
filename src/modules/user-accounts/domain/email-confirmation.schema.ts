import {Prop,Schema, SchemaFactory} from '@nestjs/mongoose';
import {addHours} from "date-fns";
@Schema({
    _id: false,
})
export class EmailConfirmation {
    @Prop({ type: Boolean, required: true, default: false })
    isConfirmed: boolean;
    @Prop({ type: String })
    confirmationCode: string;
    @Prop({ type: String, default: addHours(new Date(),24).toISOString() })
    expirationDate: string;
}
export const EmailConfirmationSchema = SchemaFactory.createForClass(EmailConfirmation);