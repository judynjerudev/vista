import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

export const useClearCacheOnUserChange = (userId: string | null): void => {
  const queryClient = useQueryClient();
  const previousUserId = useRef(userId);

  useEffect(() => {
    const previous = previousUserId.current;
    previousUserId.current = userId;
    if (previous !== null && previous !== userId) {
      queryClient.clear();
    }
  }, [queryClient, userId]);
};
