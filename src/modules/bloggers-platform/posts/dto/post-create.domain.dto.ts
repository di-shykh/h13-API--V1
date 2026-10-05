import {LikeStatus} from "../../likes/domain/likeStatus";

export class CreatePostDomainDto{
    title: string;   //maxLength: 30
    shortDescription: string;  //maxLength: 100
    content: string; //maxLength: 1000
    blogId: string;
    blogName: string;
    extendedLikesInfo: {
        likesCount: number;
        dislikesCount: number;
        myStatus: LikeStatus;
        newestLikes: [];
    }
}