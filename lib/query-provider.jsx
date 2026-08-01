"use client";

import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage, getApiSuccessMessage } from "@/lib/api-feedback";

export default function QueryProvider({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onSuccess: (data, _variables, _context, mutation) => {
            const feedback = mutation.options.meta?.feedback;
            // Existing screens often show a contextual success toast in their
            // mutate callback. Success feedback is opt-in to avoid duplicates.
            if (!feedback?.success) return;
            toast.success(
              feedback.success === true
                ? getApiSuccessMessage(data, "Changes saved successfully.")
                : feedback.success,
            );
          },
          onError: (error, _variables, _context, mutation) => {
            const feedback = mutation.options.meta?.feedback;
            if (feedback?.error === false) return;
            toast.error(feedback?.error ?? getApiErrorMessage(error));
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
