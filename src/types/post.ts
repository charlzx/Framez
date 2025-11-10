export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorUsername?: string;
  authorAvatar?: string;
  content: string;
  timestamp: number;
}

export interface Post {
  _id: string;
  authorId: string;
  authorName: string;
  authorUsername?: string;
  authorAvatar?: string;
  content: string;
  imageUrl?: string;
  imageStorageId?: string;
  timestamp: number;
  _creationTime: number;
  likeCount?: number;
  replyCount?: number;
  frameCount?: number;
  frames?: string[];
  media?: Array<{
    id: string;
    url: string;
    type: 'image' | 'video';
    alt?: string;
  }>;
  comments?: Comment[];
}
