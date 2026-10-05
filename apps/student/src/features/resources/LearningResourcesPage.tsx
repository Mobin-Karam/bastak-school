import {
  ArrowUpLeft,
  ExternalLink,
  Link2,
  Search,
  Share2,
  Video,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../../services/api-client";
import { useStudentStore } from "../../services/student-store";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { EducationShareDialog } from "../sharing/EducationShareDialog";

type LearningResource = {
  id: string;
  title: string;
  description?: string;
  type: string;
  category?: string;
  url: string;
  updatedAt?: string;
};

export function LearningResourcesPage() {
  const access = useStudentStore((state) => state.access);
  const childId = useStudentStore((state) => state.selectedGuardianStudentId);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [revision, setRevision] = useState(0);
  const [shareResource, setShareResource] = useState<LearningResource | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    let active = true;
    if (access?.mode === "guardian" && !childId) {
      setResources([]);
      setStatus("ready");
      return () => {
        active = false;
      };
    }
    setStatus("loading");
    const query =
      access?.mode === "guardian" && childId
        ? `?studentId=${encodeURIComponent(childId)}`
        : "";
    void apiClient
      .request<LearningResource[]>(
        "GET",
        `/learning-resources/assigned${query}`,
      )
      .then((items) => {
        if (!active) return;
        setResources(items);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [access?.mode, childId, revision]);

  useEffect(() => {
    const onEducationEvent = (event: Event) => {
      const type = (event as CustomEvent<{ type?: string }>).detail?.type;
      if (type === "learning-resource.updated")
        setRevision((value) => value + 1);
    };
    window.addEventListener("moshaver:v2-event", onEducationEvent);
    return () =>
      window.removeEventListener("moshaver:v2-event", onEducationEvent);
  }, []);

  const categories = useMemo(
    () =>
      [
        ...new Set(
          resources.map((resource) => resource.category?.trim() || "عمومی"),
        ),
      ].sort((a, b) => a.localeCompare(b, "fa")),
    [resources],
  );
  const visibleResources = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fa-IR");
    return resources.filter((resource) => {
      const resourceCategory = resource.category?.trim() || "عمومی";
      const matchesQuery =
        !normalizedQuery ||
        [resource.title, resource.description, resourceCategory]
          .filter(Boolean)
          .some((value) =>
            value!.toLocaleLowerCase("fa-IR").includes(normalizedQuery),
          );
      return (
        matchesQuery &&
        (!category || resourceCategory === category) &&
        (!type || resource.type === type)
      );
    });
  }, [category, query, resources, type]);
  const hasFilters = Boolean(query || category || type);
  const clearFilters = () => {
    setQuery("");
    setCategory("");
    setType("");
  };

  return (
    <section className="resource-library">
      <header className="resource-library__header">
        <div>
          <small>کتابخانه من</small>
          <h1>منابع آموزشی</h1>
          <p>
            {access?.mode === "guardian"
              ? "محتوای منتشرشده برای فرزند انتخاب‌شده"
              : "محتوای انتخاب‌شده توسط تیم آموزشی برای شما"}
          </p>
        </div>
        <Link to="/more" aria-label="بازگشت به بیشتر">
          <ArrowUpLeft />
        </Link>
      </header>
      {status === "loading" ? (
        <LoadingState label="در حال دریافت منابع آموزشی" />
      ) : null}
      {status === "error" ? (
        <ErrorState
          message="دریافت منابع آموزشی ناموفق بود."
          onRetry={() => setRevision((value) => value + 1)}
        />
      ) : null}
      {status === "ready" && !resources.length ? (
        <EmptyState title="هنوز منبعی برای شما منتشر نشده است." />
      ) : null}
      {status === "ready" && resources.length ? (
        <>
          <div className="resource-library__tools">
            <label className="resource-library__search">
              <Search aria-hidden="true" />
              <span className="sr-only">جست‌وجوی منابع</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="جست‌وجو در عنوان، توضیح یا دسته"
              />
            </label>
            <select
              aria-label="دسته‌بندی منبع"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">همه دسته‌ها</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              aria-label="نوع منبع"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="">همه نوع‌ها</option>
              <option value="VIDEO">ویدئو</option>
              <option value="LINK">پیوند</option>
            </select>
            {hasFilters ? (
              <button
                className="resource-library__clear"
                type="button"
                onClick={clearFilters}
              >
                <X aria-hidden="true" />
                پاک‌سازی
              </button>
            ) : null}
          </div>
          <p className="resource-library__count" aria-live="polite">
            {visibleResources.length.toLocaleString("fa-IR")} منبع از{" "}
            {resources.length.toLocaleString("fa-IR")}
          </p>
          {visibleResources.length ? (
            <div className="resource-library__grid">
              {visibleResources.map((resource) => (
                <article key={resource.id} className="resource-card">
                  <span className="resource-card__icon">
                    {resourceIcon(resource.type)}
                  </span>
                  <div>
                    <div className="resource-card__meta">
                      <small>{resourceLabel(resource.type)}</small>
                      <span>{resource.category?.trim() || "عمومی"}</span>
                    </div>
                    <h2>{resource.title}</h2>
                    {resource.description ? (
                      <p>{resource.description}</p>
                    ) : null}
                  </div>
                  <div className="resource-card__actions">
                    <a href={resource.url} target="_blank" rel="noreferrer">
                      <ExternalLink aria-hidden="true" />
                      باز کردن منبع
                    </a>
                    {access?.canShareEducation ? (
                      <button
                        type="button"
                        onClick={() => setShareResource(resource)}
                      >
                        <Share2 aria-hidden="true" />
                        اشتراک
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="resource-library__filtered-empty">
              <EmptyState title="منبعی با این فیلترها پیدا نشد." />
              <button
                className="resource-library__empty-action"
                type="button"
                onClick={clearFilters}
              >
                نمایش همه منابع
              </button>
            </div>
          )}
        </>
      ) : null}
      {shareResource ? (
        <EducationShareDialog
          endpoint={`/education-sharing/learning-resources/${encodeURIComponent(shareResource.id)}`}
          title={`اشتراک ${shareResource.title}`}
          onClose={() => setShareResource(null)}
        />
      ) : null}
    </section>
  );
}

function resourceIcon(type: string) {
  if (type === "VIDEO") return <Video aria-hidden="true" />;
  return <Link2 aria-hidden="true" />;
}

function resourceLabel(type: string) {
  if (type === "VIDEO") return "ویدئو";
  return "پیوند";
}
