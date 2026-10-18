import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Music2, PauseCircle, PlayCircle, Plus, Power, Users } from "lucide-react";
import { useRef, useState } from "react";
import { notify } from "../../../shared/ui/notifications";
import { Button, Card, EmptyState, Field, Input } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { listOrganizations } from "../../access/api/access.api";
import {
  createRelaxationTrack,
  getRelaxationTrackAudience,
  getRelaxationTracks,
  updateRelaxationTrack,
  type RelaxationTrackDraft,
} from "../api/system.api";
import { systemCopy } from "../system-locale";

const emptyDraft: RelaxationTrackDraft = {
  title: "",
  artist: "",
  url: "",
  active: true,
  gradeIds: [],
};

export function RelaxationMusicManager() {
  const { language } = useLocale();
  const copy = systemCopy(language);
  const qc = useQueryClient();
  const audio = useRef<HTMLAudioElement>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const tracks = useQuery({ queryKey: ["relaxation-tracks"], queryFn: getRelaxationTracks });
  const organizations = useQuery({
    queryKey: ["organizations", "relaxation-targeting"],
    queryFn: listOrganizations,
  });
  const [audienceTrackId, setAudienceTrackId] = useState<string | null>(null);
  const audience = useQuery({
    queryKey: ["relaxation-track-audience", audienceTrackId],
    queryFn: () => getRelaxationTrackAudience(audienceTrackId!),
    enabled: Boolean(audienceTrackId),
  });
  const create = useMutation({
    mutationFn: () => createRelaxationTrack(draft),
    onSuccess: () => {
      setDraft(emptyDraft);
      notify(copy.musicAdded);
      void qc.invalidateQueries({ queryKey: ["relaxation-tracks"] });
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : copy.musicCreateFailed, "error"),
  });
  const toggle = useMutation({
    mutationFn: ({ id, body }: { id: string; body: RelaxationTrackDraft }) =>
      updateRelaxationTrack(id, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["relaxation-tracks"] }),
    onError: (error) =>
      notify(error instanceof Error ? error.message : copy.musicCreateFailed, "error"),
  });

  function preview(id: string, url: string) {
    if (!audio.current) return;
    if (playingId === id && !audio.current.paused) {
      audio.current.pause();
      audio.current.removeAttribute("src");
      audio.current.load();
      setPlayingId(null);
      return;
    }
    audio.current.pause();
    audio.current.removeAttribute("src");
    audio.current.load();
    audio.current.src = url;
    void audio.current
      .play()
      .then(() => setPlayingId(id))
      .catch(() => notify(copy.musicPlaybackFailed, "error"));
  }

  return (
    <Card className="grid gap-4 p-5" aria-labelledby="relaxation-music-title">
      <audio ref={audio} preload="none" onEnded={() => setPlayingId(null)} />
      <div>
        <span className="flex items-center gap-2 font-black" id="relaxation-music-title">
          <Music2 size={19} className="text-brand" />
          {copy.musicTitle}
        </span>
        <p className="mt-1 text-xs leading-5 text-slate-500">{copy.musicDescription}</p>
      </div>
      <form
        className="grid gap-3 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
      >
        <Field label={copy.trackTitle}>
          <Input
            required
            maxLength={180}
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
        </Field>
        <Field label={copy.artist}>
          <Input
            maxLength={120}
            value={draft.artist}
            onChange={(event) => setDraft({ ...draft, artist: event.target.value })}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label={copy.musicUrl}>
            <Input
              required
              type="url"
              dir="ltr"
              placeholder="https://example.com/music.mp3"
              value={draft.url}
              onChange={(event) => setDraft({ ...draft, url: event.target.value })}
            />
          </Field>
        </div>
        <Field label={copy.gradeIds}>
          <Input
            placeholder={copy.gradeIdsPlaceholder}
            value={(draft.gradeIds || []).join(",")}
            onChange={(event) =>
              setDraft({
                ...draft,
                gradeIds: event.target.value
                  .split(",")
                  .map((value) => Number(value.trim()))
                  .filter((value) => Number.isInteger(value) && value > 0),
              })
            }
          />
        </Field>
        <Field label={copy.targetOrganization}>
          <select
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={draft.organizationId || ""}
            onChange={(event) =>
              setDraft({ ...draft, organizationId: event.target.value || undefined })
            }
            disabled={organizations.isLoading}
          >
            <option value="">{copy.allOrganizations}</option>
            {(organizations.data || [])
              .filter((organization) => organization.status === "ACTIVE")
              .map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label={copy.publishingStart}>
            <Input
              type="date"
              value={draft.availableFrom || ""}
              onChange={(event) =>
                setDraft({ ...draft, availableFrom: event.target.value || undefined })
              }
            />
          </Field>
          <Field label={copy.publishingEnd}>
            <Input
              type="date"
              value={draft.availableUntil || ""}
              onChange={(event) =>
                setDraft({ ...draft, availableUntil: event.target.value || undefined })
              }
            />
          </Field>
        </div>
        <Button
          className="md:col-span-2"
          disabled={create.isPending || !draft.title.trim() || !draft.url.startsWith("https://")}
        >
          <Plus size={16} />
          {create.isPending ? copy.adding : copy.addDailyPlaylist}
        </Button>
      </form>
      {tracks.isError ? (
        <EmptyState
          title={copy.musicLoadFailed}
          action={
            <Button variant="soft" onClick={() => void tracks.refetch()}>
              {copy.retry}
            </Button>
          }
        />
      ) : null}
      <div className="grid gap-2">
        {tracks.data?.map((track) => (
          <div
            key={track.id}
            className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
          >
            <button
              type="button"
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"
              onClick={() => preview(track.id, track.url)}
              aria-label={
                playingId === track.id
                  ? copy.pausePreview(track.title)
                  : copy.playPreview(track.title)
              }
            >
              {playingId === track.id ? <PauseCircle /> : <PlayCircle />}
            </button>
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-sm">{track.title}</strong>
              <span className="block truncate text-xs text-slate-500">
                {track.artist || copy.unknownArtist}
              </span>
            </div>
            <Button
              variant="soft"
              onClick={() =>
                toggle.mutate({
                  id: track.id,
                  body: {
                    title: track.title,
                    artist: track.artist,
                    url: track.url,
                    active: !track.active,
                    organizationId: track.organizationId || undefined,
                    gradeIds: track.gradeIds || [],
                    availableFrom: track.availableFrom || undefined,
                    availableUntil: track.availableUntil || undefined,
                  },
                })
              }
            >
              <Power size={15} />
              {track.active ? copy.active : copy.inactive}
            </Button>
            <Button variant="ghost" onClick={() => setAudienceTrackId(track.id)}>
              <Users size={15} />
              {copy.audience}
            </Button>
          </div>
        ))}
      </div>
      {audienceTrackId ? (
        <div className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
          <div className="flex items-center justify-between">
            <strong>{copy.audiencePreview}</strong>
            <Button variant="ghost" size="sm" onClick={() => setAudienceTrackId(null)}>
              {copy.close}
            </Button>
          </div>
          {audience.isLoading ? (
            <p className="mt-2 text-slate-500">{copy.calculating}</p>
          ) : audience.isError ? (
            <p className="mt-2 text-red-700">{copy.audienceFailed}</p>
          ) : (
            <p className="mt-2">
              {copy.eligibleStudents(audience.data?.eligibleStudents || 0)}
              {audience.data?.byGrade.length
                ? ` · ${audience.data.byGrade.map((item) => copy.gradeAudience(item.grade, item.count)).join(language === "fa" ? "، " : ", ")}`
                : ""}
            </p>
          )}
        </div>
      ) : null}
    </Card>
  );
}
