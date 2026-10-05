import { useSearchParams } from "react-router-dom";

export function useChatSelectionParams() {
  const [params, setParams] = useSearchParams();
  return {
    params,
    requestedStudentId: params.get("studentId") || "",
    requestedConversationId: params.get("conversationId") || "",
    select(conversationId: string, studentId?: string, replace = false) {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set("conversationId", conversationId);
          if (studentId) next.set("studentId", studentId);
          else next.delete("studentId");
          return next;
        },
        { replace },
      );
    },
    clear() {
      setParams((current) => {
        const next = new URLSearchParams(current);
        next.delete("conversationId");
        next.delete("studentId");
        return next;
      });
    },
    setView(nextView: { q?: string; filter?: string; sort?: string }) {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (nextView.q !== undefined) nextView.q ? next.set("q", nextView.q) : next.delete("q");
          if (nextView.filter !== undefined)
            nextView.filter === "all" ? next.delete("filter") : next.set("filter", nextView.filter);
          if (nextView.sort !== undefined)
            nextView.sort === "recent" ? next.delete("sort") : next.set("sort", nextView.sort);
          return next;
        },
        { replace: true },
      );
    },
  };
}
