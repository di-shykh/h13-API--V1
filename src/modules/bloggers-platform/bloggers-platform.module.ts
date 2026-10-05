import { Module } from '@nestjs/common';
import { User, UserSchema } from '../user-accounts/domain/user.entity';

import {BlogsController} from "./blogs/api/blogs.controller";
import {PostsController} from "./posts/api/posts.controller";
import {CommentsController} from "./comments/api/comments.controller";

import {BlogsService} from "./blogs/application/blogs.service";
import {PostsService} from "./posts/application/posts.service";
import {CommentsService} from "./comments/application/comments.service";

import { BlogsRepository } from './blogs/infrastructure/blogs.repository';
import { PostsRepository } from './posts/infrastructure/posts.repository';
//import { CommentsRepository } from './comments/infrastructure/comments.repository';

import { BlogsQueryRepository } from './blogs/infrastructure/query/blogs.query-repository';
import { PostsQueryRepository } from './posts/infrastructure/query/posts.query-repository';
import { CommentsQueryRepository } from './comments/infrastructure/query/comments.query-repository';
import {MongooseModule} from "@nestjs/mongoose";
import {Blog, BlogSchema} from "./blogs/domain/blog.entity";
import {Comment, CommentSchema} from "./comments/domain/comment.entity";
import {Post, PostSchema} from "./posts/domain/post.entity";
import {UserAccountsModule} from "../user-accounts/userAccounts.module";
import {
  UsersExternalQueryRepository
} from "../user-accounts/infrastructure/external-query/users.external-query-repository";
import {UsersExternalService} from "../user-accounts/application/users.external-service";
import {Like, LikeSchema} from "./likes/domain/like.entity";
import {PassportModule} from "@nestjs/passport";
// import {UsersService} from "../user-accounts/application/users-service";
// import {UsersController} from "../user-accounts/api/users-controller";

@Module({
  imports: [
      UserAccountsModule,
      MongooseModule.forFeature([
        { name: User.name, schema: UserSchema },
        {name: Blog.name, schema: BlogSchema},
        {name: Post.name, schema: PostSchema},
        {name: Comment.name, schema: CommentSchema},
        { name: Like.name, schema: LikeSchema },
      ]),
    PassportModule,
  ],
  controllers: [
    // UsersController,
    BlogsController,
    PostsController,
    CommentsController
  ],
  providers: [
    // UsersService,
    BlogsService,
    PostsService,
    CommentsService,
    BlogsRepository,
    PostsRepository,
    //CommentsRepository,
    BlogsQueryRepository,
    PostsQueryRepository,
    CommentsQueryRepository,

  ]
})
export class BloggersPlatformModule {}
