export interface User {
  _id: string;
  clerkId: string;
  email: string;
  name: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
}
