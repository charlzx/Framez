import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import type { Doc } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { useSettingsStore } from '../store/settingsStore';
import type { User } from '../types/user';

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

/**
 * Keeps the local people directory hydrated with Convex user documents.
 */
export function UsersHydrator(): null {
  const setPeople = useSettingsStore((state) => state.setPeople);
  const users = useQuery(api.users.list);

  useEffect(() => {
    if (!users) {
      return;
    }

    const mapped = users.map(mapConvexUserToUser);
    setPeople(mapped);
  }, [setPeople, users]);

  return null;
}
