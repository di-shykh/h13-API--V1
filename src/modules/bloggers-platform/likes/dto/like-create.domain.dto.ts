import {LikeStatus} from "../domain/likeStatus";

export class CreateLikeDomainDto {
    createdAt: Date;
    status: LikeStatus;
    authorId: string;
    parentId: string;
}