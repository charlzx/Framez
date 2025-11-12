import { create } from 'zustand';
import { ThemeMode } from '../constants/colors';
import { Post } from '../types/post';
import { User } from '../types/user';

interface NotificationItem {
  id: string;
  type: 'like' | 'reply' | 'follow' | 'system';
  title: string;
  description: string;
  read: boolean;
  timestamp: number;
}

interface SettingsState {
  themeMode: ThemeMode;
  displayName: string;
  username: string;
  description: string;
  avatarUrl: string;
  currentUserId: string;
  posts: Post[];
  setPosts: (posts: Post[]) => void;
  removePost: (postId: string) => void;
  setCurrentUserProfile: (payload: Partial<User> & { clerkId?: string }) => void;
  setPeople: (people: User[]) => void;
  likedPostIds: string[];
  setLikedPostIds: (ids: string[]) => void;
  applyLikeState: (postId: string, liked: boolean) => void;
  hiddenPostIds: string[];
  setHiddenPostIds: (ids: string[]) => void;
  notifications: NotificationItem[];
  setNotifications: (notifications: NotificationItem[]) => void;
  recentSearches: string[];
  people: User[];
  takenUsernames: string[];
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  updateProfile: (payload: Partial<Pick<SettingsState, 'displayName' | 'description' | 'avatarUrl' | 'username'>>) => void;
  attemptUsernameChange: (desired: string) => { success: boolean; message?: string };
  toggleLike: (postId: string) => void;
  addRecentSearch: (term: string) => void;
  hidePost: (postId: string) => void;
  unhidePost: (postId: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  getUnreadCount: () => number;
}

const normalizeUsername = (value: string) => value.trim().toLowerCase();

export const useSettingsStore = create<SettingsState>((set, get) => ({
  themeMode: 'light',
  displayName: 'Framez User',
  username: '',
  description: '',
  avatarUrl: '',
  currentUserId: '',
  posts: [],
  setPosts: (posts) =>
    set({
      posts: posts.filter((post) => post.content.trim().length > 0),
    }),
  removePost: (postId) =>
    set((state) => ({
      posts: state.posts.filter((post) => post._id !== postId),
      likedPostIds: state.likedPostIds.filter((id) => id !== postId),
      hiddenPostIds: state.hiddenPostIds.filter((id) => id !== postId),
    })),
  setCurrentUserProfile: (payload) =>
    set((state) => {
      const clerkId = payload.clerkId ?? state.currentUserId;
      const hasExistingPerson = state.people.some((person) => person.clerkId === clerkId);

      const updatedPeople = hasExistingPerson
        ? state.people.map((person) =>
            person.clerkId === clerkId
              ? {
                  ...person,
                  ...payload,
                  clerkId,
                  displayName: payload.displayName ?? payload.name ?? person.displayName,
                  username: payload.username ?? person.username,
                  bio: payload.bio ?? person.bio,
                  avatarUrl: payload.avatarUrl ?? person.avatarUrl,
                }
              : person
          )
        : state.people.concat({
            _id: payload._id ?? `user-${clerkId}`,
            clerkId,
            email: payload.email ?? '',
            name: payload.name ?? payload.displayName ?? 'Framez User',
            displayName: payload.displayName ?? payload.name ?? 'Framez User',
            username: payload.username,
            avatarUrl: payload.avatarUrl,
            bio: payload.bio,
            followersCount: payload.followersCount ?? 0,
            followingCount: payload.followingCount ?? 0,
          });

      return {
        displayName: payload.displayName ?? payload.name ?? state.displayName,
        username: payload.username ?? state.username,
        description: payload.bio ?? state.description,
        avatarUrl: payload.avatarUrl ?? state.avatarUrl,
        currentUserId: clerkId,
        people: updatedPeople,
        takenUsernames: Array.from(
          new Set(
            updatedPeople
              .map((person) => normalizeUsername(person.username ?? person.displayName ?? ''))
              .filter((value) => value.length > 0)
          )
        ),
      };
    }),
  setPeople: (people) =>
    set((state) => {
      const usernames = people
        .map((person) => normalizeUsername(person.username ?? person.displayName ?? ''))
        .filter((value) => value.length > 0);

      const uniqueUsernames = Array.from(new Set(usernames));

      return {
        people,
        takenUsernames: uniqueUsernames,
        // Ensure the current profile stays in sync if it exists in the incoming list
        displayName:
          state.displayName === 'Framez User'
            ? people.find((person) => person.clerkId === state.currentUserId)?.displayName ?? state.displayName
            : state.displayName,
        username:
          !state.username || state.username === ''
            ? people.find((person) => person.clerkId === state.currentUserId)?.username ?? state.username
            : state.username,
      };
    }),
  likedPostIds: [],
  setLikedPostIds: (ids) =>
    set({ likedPostIds: Array.from(new Set(ids)) }),
  applyLikeState: (postId, liked) =>
    set((state) => {
      const hasLiked = state.likedPostIds.includes(postId);

      if (liked && hasLiked) {
        return state;
      }

      if (!liked && !hasLiked) {
        return state;
      }

      return {
        likedPostIds: liked
          ? state.likedPostIds.concat(postId)
          : state.likedPostIds.filter((id) => id !== postId),
      };
    }),
  hiddenPostIds: [],
  setHiddenPostIds: (ids) =>
    set({ hiddenPostIds: Array.from(new Set(ids)) }),
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  recentSearches: [],
  people: [],
  takenUsernames: [],
  toggleTheme: () =>
    set((state) => ({
      themeMode: state.themeMode === 'light' ? 'dark' : 'light',
    })),
  setThemeMode: (mode) => set({ themeMode: mode }),
  updateProfile: (payload) =>
    set((state) => ({
      displayName: payload.displayName ?? state.displayName,
      description: payload.description ?? state.description,
      username: payload.username ?? state.username,
      avatarUrl: payload.avatarUrl ?? state.avatarUrl,
      people: state.people.map((person) =>
        person.clerkId === state.currentUserId
          ? {
              ...person,
              displayName: payload.displayName ?? state.displayName,
              username: payload.username ?? person.username,
              bio: payload.description ?? state.description,
              avatarUrl: payload.avatarUrl ?? state.avatarUrl,
            }
          : person
      ),
    })),
  attemptUsernameChange: (desired) => {
    const next = normalizeUsername(desired);
    const current = normalizeUsername(get().username);

    if (!next) {
      return { success: false, message: 'Enter a username to continue.' };
    }

    if (next === current) {
      return { success: false, message: 'You are already using this username.' };
    }

    if (!/^[a-z0-9_]{3,20}$/.test(next)) {
      return {
        success: false,
        message: 'Use 3-20 characters, lowercase letters, numbers, or underscores.',
      };
    }

    const { takenUsernames } = get();
    if (takenUsernames.includes(next)) {
      return { success: false, message: 'That username is not available.' };
    }

    set((state) => ({
      username: next,
      takenUsernames: state.takenUsernames
        .filter((name) => name !== current)
        .concat(next),
      people: state.people.map((person) =>
        person.clerkId === state.currentUserId
          ? { ...person, username: next }
          : person
      ),
    }));

    return { success: true };
  },
  toggleLike: (postId) =>
    set((state) => {
      const alreadyLiked = state.likedPostIds.includes(postId);
      const updatedLikes = alreadyLiked
        ? state.likedPostIds.filter((id) => id !== postId)
        : state.likedPostIds.concat(postId);
      return {
        likedPostIds: updatedLikes,
      };
    }),
  addRecentSearch: (term) => {
    const value = term.trim();
    if (!value) {
      return;
    }

    set((state) => {
      const next = [value, ...state.recentSearches.filter((item) => item !== value)];
      return {
        recentSearches: next.slice(0, 6),
      };
    });
  },
  hidePost: (postId) =>
    set((state) => {
      if (state.hiddenPostIds.includes(postId)) {
        return state;
      }

      return {
        hiddenPostIds: state.hiddenPostIds.concat(postId),
      };
    }),
  unhidePost: (postId) =>
    set((state) => {
      if (!state.hiddenPostIds.includes(postId)) {
        return state;
      }

      return {
        hiddenPostIds: state.hiddenPostIds.filter((id) => id !== postId),
      };
    }),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      ),
    })),
  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((notification) => ({
        ...notification,
        read: true,
      })),
    })),
  getUnreadCount: () => get().notifications.filter((notification) => !notification.read).length,
}));
