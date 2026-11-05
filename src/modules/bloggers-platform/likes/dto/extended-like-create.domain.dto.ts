import {LikeStatus} from "../domain/likeStatus";

export class ExtendedLikeCreateDomainDto {
    addedAt: string;
    status: LikeStatus;
    userId: string;
    userLogin: string;
    postId: string;
}