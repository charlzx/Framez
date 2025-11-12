import { useEffect, useMemo, useRef } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { useMutation, useQuery } from 'convex/react';
import type { Doc } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { useSettingsStore } from '../store/settingsStore';
import type { User } from '../types/user';

const buildPayload = (params: {
  clerkId: string;
  email: string;
  name: string;
  displayName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}): {
  clerkId: string;
  email: string;
  name: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
} => {
  const { clerkId, email, name, displayName, username, avatarUrl, bio } = params;
  return {
    clerkId,
    email,
    name,
    displayName: displayName ?? undefined,
    username: username ?? undefined,
    avatarUrl: avatarUrl ?? undefined,
    bio: bio ?? undefined,
  };
};

  const mapConvexUserToUser = (doc: Doc<'users'>): User => ({
    _id: doc._id,
    clerkId: doc.clerkId,
    email: doc.email,
    name: doc.name,
    displayName: doc.displayName ?? doc.name,
    username: doc.username ?? undefined,
    avatarUrl: doc.avatarUrl ?? undefined,
    bio: doc.bio ?? undefined,
    followersCount: doc.followersCount ?? 0,
    followingCount: doc.followingCount ?? 0,
  });

  const hasProfileDifferences = (doc: Doc<'users'>, payload: ReturnType<typeof buildPayload>): boolean => {
    const avatarMismatch =
      payload.avatarUrl !== undefined &&
      !doc.avatarStorageId &&
      doc.avatarUrl !== payload.avatarUrl;

    return (
      doc.email !== payload.email ||
      doc.name !== payload.name ||
      (payload.displayName !== undefined && doc.displayName !== payload.displayName) ||
      (payload.username !== undefined && doc.username !== payload.username) ||
      (payload.bio !== undefined && doc.bio !== payload.bio) ||
      avatarMismatch
    );
  };

/**
 * Ensures the signed-in Clerk user has a corresponding Convex user document
 * and keeps the local profile store in sync.
 */
export function CurrentUserHydrator(): null {
  const { user } = useUser();
  const storeUser = useMutation(api.users.store);
  const setCurrentUserProfile = useSettingsStore((state) => state.setCurrentUserProfile);
  const hasRequestedCreate = useRef(false);

  const clerkId = user?.id;
  const currentUser = useQuery(
    api.users.getByClerkId,
    clerkId ? { clerkId } : 'skip'
  );

  const payload = useMemo(() => {
    if (!user) {
      return null;
    }

    return buildPayload({
      clerkId: user.id,
      email: user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? '',
      name: user.fullName ?? user.firstName ?? 'Framez User',
      displayName: user.fullName,
      username: user.username,
      avatarUrl: user.imageUrl,
      bio: user.publicMetadata?.bio as string | undefined,
    });
  }, [user]);

  useEffect(() => {
    if (!payload) {
      return;
    }

    if (currentUser === undefined) {
      return;
    }

    if (!currentUser) {
      if (hasRequestedCreate.current) {
        return;
      }

      hasRequestedCreate.current = true;
      void storeUser(payload)
        .then((docId) => {
          setCurrentUserProfile({ ...payload, _id: docId, clerkId: payload.clerkId });
        })
        .catch((error) => {
          console.error('Failed to create user profile in Convex', error);
          hasRequestedCreate.current = false;
        });
      return;
    }

    hasRequestedCreate.current = false;
    if (hasProfileDifferences(currentUser, payload)) {
      void storeUser(payload);
    }

    setCurrentUserProfile({ ...mapConvexUserToUser(currentUser) });
  }, [currentUser, payload, setCurrentUserProfile, storeUser]);

  return null;
}
