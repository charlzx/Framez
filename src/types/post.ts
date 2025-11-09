export interface Post {
  _id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  imageUrl?: string;
  imageStorageId?: string;
  timestamp: number;
  _creationTime: number;
}
