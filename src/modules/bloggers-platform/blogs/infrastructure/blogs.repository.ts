import {InjectModel} from "@nestjs/mongoose";
import {Blog, BlogDocument,type BlogModelType} from "../domain/blog.entity";
import {Injectable, NotFoundException} from "@nestjs/common";
import {Types} from "mongoose";

@Injectable()
export class BlogsRepository {
    constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType) {}
    async findById(id: string): Promise<BlogDocument|null> {
        const objectId =  new Types.ObjectId(id);
        return this.BlogModel.findOne({
            _id: objectId,
            deletedAt: null,
        });
    }
    async save(blog: BlogDocument){
        await blog.save();
    }
    async findByIdOrNotFoundFail(id: string): Promise<BlogDocument> {
        const blog = await this.findById(id);
        if (!blog) {
            throw new NotFoundException('Blog not found.');
        }
        return blog;
    }
}