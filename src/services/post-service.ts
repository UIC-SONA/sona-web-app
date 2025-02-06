import apiClient from "@/lib/axios.ts";
import {
  Entity,
  Page,
  PageQuery
} from "@/lib/crud.ts";
import {
  restDeleteable, restExportable,
  restFindable,
  restPageable
} from "@/lib/rest-crud.ts";

const resource = '/forum/post';


export interface ByAuthor<T> {
  author: T | null; // null if the author is anonymous
}

export interface Post extends ByAuthor<number>, Entity<string> {
  id: string;
  content: string;
  likedBy: string[];
  reportedBy: string[];
  createdAt: Date;
  comments: Comment[];
}

export interface Comment extends ByAuthor<number> {
  id: string;
  content: string;
  likedBy: string[];
  reportedBy: string[];
  createdAt: Date;
}

export interface TopPostsDto {
  mostLikedPost: Post | null;
  mostCommentedPost: Post | null;
}

export interface PostDto {
  anonymous: boolean | undefined;
  content: string;
}

export interface CommentFilters {
  authorId: number;
}

function modelTransformer(model: any): Post {
  return {
    ...model,
    createdAt: new Date(model.createdAt),
    comments: model.comments.map(commentModelTransformer),
  };
}

function commentModelTransformer(model: any): Comment {
  return {
    ...model,
    createdAt: new Date(model.createdAt),
  };
}

async function topPosts(): Promise<TopPostsDto> {
  const response = await apiClient.get<any>(`${resource}/top`);
  const data = response.data;
  const mostLikedPost = data.mostLikedPost ? modelTransformer(data.mostLikedPost) : null;
  const mostCommentedPost = data.mostCommentedPost ? modelTransformer(data.mostCommentedPost) : null;
  return {mostLikedPost, mostCommentedPost};
}

async function pageComments(postId: string, query: PageQuery<CommentFilters>): Promise<Page<Comment>> {
  const operarion = restPageable<Comment, CommentFilters>(apiClient, `${resource}/${postId}/comments`, {modelTransformer: commentModelTransformer});
  return await operarion.page(query);
}

async function deleteComment(postId: string, commentId: string): Promise<void> {
  const operarion = restDeleteable<string>(apiClient, `${resource}/${postId}/comments`);
  await operarion.delete(commentId);
}

const pageable = restPageable<Post>(apiClient, resource, {modelTransformer});
const exportable = restExportable(apiClient, resource);
const findable = restFindable<Post, string>(apiClient, resource, {modelTransformer});
const deletable = restDeleteable<string>(apiClient, resource);

export const postService = {
  ...pageable,
  ...exportable,
  ...findable,
  ...deletable,
  topPosts,
  pageComments,
  deleteComment,
}