export class CreateCommentDomainDto {
    content: string;
    postId: string;
    commentatorInfo: {
        userId: string;
        userLogin: string;
    }
}