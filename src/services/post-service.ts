import apiClient from "@/lib/axios.ts";
import {Entity} from "@/lib/crud.ts";
import {
  restDeleteable,
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

function modelTransformer(model: any): Post {
  return {
    ...model,
    createdAt: new Date(model.createdAt),
    comments: model.comments.map((comment: any) => ({
      ...comment,
      createdAt: new Date(comment.createdAt),
    })),
  };
}

async function topPosts(): Promise<TopPostsDto> {
  const response = await apiClient.get<any>(`${resource}/top`);
  const data = response.data;
  const mostLikedPost = data.mostLikedPost ? modelTransformer(data.mostLikedPost) : null;
  const mostCommentedPost = data.mostCommentedPost ? modelTransformer(data.mostCommentedPost) : null;
  return {mostLikedPost, mostCommentedPost};
}

const pageable = restPageable<Post>(apiClient, resource, {modelTransformer});
const findable = restFindable<Post, string>(apiClient, resource, {modelTransformer});
const deletable = restDeleteable<string>(apiClient, resource);

export const postService = {
  ...pageable,
  ...findable,
  ...deletable,
  topPosts,
}