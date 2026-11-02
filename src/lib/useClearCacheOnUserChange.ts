import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Cached data belongs to whoever fetched it. Clearing the cache when they
// sign out (including when their session expires), or when a different user
// signs in, means nobody else on this device ever sees it.
export const useClearCacheOnUserChange = (userId: string | null): void => {
  const queryClient = useQueryClient();
  const previousUserId = useRef(userId);

  useEffect(() => {
    if (previousUserId.current === userId) {
      return;
    }
    previousUserId.current = userId;
    queryClient.clear();
  }, [queryClient, userId]);
};
