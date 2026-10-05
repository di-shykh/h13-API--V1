import {LikeStatus} from "../../../likes/domain/likeStatus";
import {CommentDocument} from "../../domain/comment.entity";

export class commentatorInfo {
    userId: string;
    userLogin: string;
}
export class CommentViewDto {
    id: string;
    content: string;
    commentatorInfo: commentatorInfo;
    createdAt: string;
    likesInfo: {
        likesCount: number;
        dislikesCount: number;
        myStatus: LikeStatus;
    }
    static mapToView(comment: CommentDocument, myStatus: LikeStatus): CommentViewDto {
        const dto = new CommentViewDto();
        dto.id = comment._id.toString();
        dto.content = comment.content;
        dto.commentatorInfo.userId = comment.userId;
        dto.commentatorInfo.userLogin = comment.userLogin;
        dto.createdAt = comment.createdAt;
        dto.likesInfo.likesCount = comment.likesCount || 0;
        dto.likesInfo.dislikesCount = comment.dislikesCount || 0;
        dto.likesInfo.myStatus = myStatus || 'None';
        return dto;
    }
}