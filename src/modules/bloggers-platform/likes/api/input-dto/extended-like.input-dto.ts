import {LikeStatus} from "../../domain/likeStatus";
import { IsEnum, IsNotEmpty } from 'class-validator';

export class ExtendedLikeInputDto {
    @IsEnum(LikeStatus, {
        message: 'likeStatus must be one of: None, Like, Dislike'
    })
    @IsNotEmpty()
    likeStatus: LikeStatus;
}