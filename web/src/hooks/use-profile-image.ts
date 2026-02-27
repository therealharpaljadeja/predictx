"use client";

import { useQuery } from "@tanstack/react-query";

interface AvatarData {
  username: string | null;
  avatarUrl: string | null;
}

async function fetchAvatar(endpointPath: string): Promise<AvatarData> {
  // For follower markets, skip the API call entirely
  const usernameMatch = endpointPath.match(/users\/by\/username\/([^?]+)/);
  if (usernameMatch) {
    const username = usernameMatch[1];
    return { username, avatarUrl: `https://unavatar.io/x/${username}` };
  }

  // For tweet markets, call the API route (server caches the resolution)
  const res = await fetch(`/api/twitter-avatar?endpointPath=${encodeURIComponent(endpointPath)}`);
  if (!res.ok) return { username: null, avatarUrl: null };
  return res.json();
}

export function useProfileImage(endpointPath: string) {
  return useQuery({
    queryKey: ["profileImage", endpointPath],
    queryFn: () => fetchAvatar(endpointPath),
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: !!endpointPath,
  });
}
