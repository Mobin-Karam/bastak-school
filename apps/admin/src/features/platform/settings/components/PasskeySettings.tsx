import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Fingerprint, Trash2 } from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";
import { Button, Card } from "../../../../shared/ui/ui";
import { api } from "../../../../shared/api/api";

type Passkey = {
  id: string;
  createdAt: string;
  lastUsedAt: string | null;
  deviceType: string | null;
};
export function PasskeySettings() {
  const qc = useQueryClient();
  const keys = useQuery({
    queryKey: ["passkeys"],
    queryFn: () => api.get<Passkey[]>("/auth/passkeys"),
  });
  async function add() {
    const data = await api.post<{ challengeId: string; options: Record<string, unknown> }>(
      "/auth/passkeys/registration/options",
      {},
    );
    const response = await startRegistration({ optionsJSON: data.options as never });
    await api.post("/auth/passkeys/registration/verify", {
      challengeId: data.challengeId,
      response,
    });
    await qc.invalidateQueries({ queryKey: ["passkeys"] });
  }
  return (
    <Card className="p-5 sm:p-6" dir="rtl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <Fingerprint className="mt-1 text-brand" />
          <div>
            <h3 className="font-bold">کلیدهای ورود دستگاه</h3>
            <p className="text-xs text-slate-500">
              اثر انگشت، چهره یا قفل دستگاه؛ بدون نگهداری اطلاعات بیومتریک.
            </p>
          </div>
        </div>
        <Button onClick={() => void add()}>افزودن دستگاه</Button>
      </div>
      <div className="mt-4 grid gap-2">
        {keys.data?.map((key) => (
          <div
            key={key.id}
            className="flex items-center justify-between rounded-lg border p-3 text-sm"
          >
            <span>
              کلید دستگاه{" "}
              {key.lastUsedAt
                ? `· آخرین استفاده ${new Date(key.lastUsedAt).toLocaleDateString("fa-IR")}`
                : ""}
            </span>
            <Button
              variant="danger"
              aria-label="حذف کلید"
              onClick={() =>
                void api
                  .delete(`/auth/passkeys/${key.id}`)
                  .then(() => qc.invalidateQueries({ queryKey: ["passkeys"] }))
              }
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )) || null}
      </div>
    </Card>
  );
}
