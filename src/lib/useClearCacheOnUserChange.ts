import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

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
