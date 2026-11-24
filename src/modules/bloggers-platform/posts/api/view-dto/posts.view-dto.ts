import {PostDocument} from "../../domain/post.entity";
import {LikeStatus} from "../../../likes/domain/likeStatus";

export class LikeInfoViewDto {
    addedAt: string;
    userId: string;
    login: string;
}

export class ExtendedLikesInfoViewDto {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatus;
    newestLikes: LikeInfoViewDto[];
}

export class PostViewDto {
    id: string;
    title: string;
    shortDescription: string;
    content: string;
    blogId: string;
    blogName: string;
    createdAt: string;
    extendedLikesInfo: ExtendedLikesInfoViewDto;

    static mapToView(post: PostDocument, myStatus: LikeStatus): PostViewDto {
        const dto = new PostViewDto();
        dto.id = post._id.toString();
        dto.title = post.title;
        dto.shortDescription = post.shortDescription;
        dto.content = post.content;
        dto.blogId = post.blogId;
        dto.blogName = post.blogName;
        dto.createdAt = post.createdAt;
        dto.extendedLikesInfo = {
            likesCount: post.extendedLikesInfo.likesCount||0,
            dislikesCount: post.extendedLikesInfo.dislikesCount||0,
            myStatus: myStatus,
            newestLikes: post.extendedLikesInfo?.newestLikes?.map(like =>({
                addedAt: like.addedAt,
                userId: like.userId,
                login: like.login,
            })) || [],
        };
        return dto;
    }
}