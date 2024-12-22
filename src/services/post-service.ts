import apiClient from "@/lib/axios.ts";
import {Entity, Page, PageQuery, pageQueryToQueryParams} from "@/lib/crud.ts";

export interface ByAuthor<T> {
  author: T | null; // null if the author is anonymous
}

export interface Forum extends ByAuthor<number>, Entity<string> {
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

export interface ForumDto {
  anonymous: boolean | undefined;
  content: string;
}


const resource = '/forum';

export async function pagePosts(query: PageQuery): Promise<Page<Forum>> {
  const response = await apiClient.get<Page<Forum>>(
    `${resource}`,
    {
      params: pageQueryToQueryParams(query),
    }
  );

  return response.data;
}

export async function findPost(id: string): Promise<Forum> {
  const response = await apiClient.get<Forum>(
    `${resource}/${id}`,
  );

  return response.data;
}

export async function deletePost(id: string): Promise<void> {
  await apiClient.delete<void>(
    `${resource}/${id}`,
  );
}

