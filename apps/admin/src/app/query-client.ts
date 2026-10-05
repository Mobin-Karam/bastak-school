import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { notify } from "../shared/ui/notifications";

function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : currentLanguage() === "en"
      ? "The operation could not be completed. Try again."
      : "عملیات انجام نشد. دوباره تلاش کنید.";
}

function currentLanguage() {
  return typeof document !== "undefined" && document.documentElement.lang.startsWith("en")
    ? "en"
    : "fa";
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.state.data !== undefined)
        notify(
          currentLanguage() === "en"
            ? `Could not refresh information: ${message(error)}`
            : `به‌روزرسانی اطلاعات ناموفق بود: ${message(error)}`,
          "warning",
        );
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => notify(message(error), "error"),
    onSuccess: (_data, _variables, _context, mutation) => {
      const text = mutation.options.meta?.successMessage;
      if (text !== false)
        notify(
          typeof text === "string"
            ? text
            : currentLanguage() === "en"
              ? "The operation was completed successfully."
              : "عملیات با موفقیت انجام شد.",
          "success",
        );
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 20_000,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
