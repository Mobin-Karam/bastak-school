import { createToastManager } from "./components/toast.js";
import { createPluginManager } from "./components/plugins.js";
import { formatDateTime, formatUptime, normalizePosixPath, normalizeTag } from "./utils/format.js";

const STORAGE = {
  theme: "docsViewer.theme",
  recent: "docsViewer.recent",
  notes: "docsViewer.dailyNotes",
  tasks: "docsViewer.dailyTasks",
  desktopSidebarCollapsed: "docsViewer.desktopSidebarCollapsed",
  personalityChecklist: "docsViewer.personalityChecklist"
};

const state = {
  files: [],
  currentPath: "",
  filter: "",
  tagFilter: "",
  scope: "all",
  sort: "date-desc",
  groupOpen: { docs: true, agents: true },
  folderOpen: {},
  recent: [],
  themePreference: "system",
  sidebarOpen: false,
  desktopSidebarCollapsed: false,
  currentModifiedAt: "",
  currentMetadata: null,
  currentTags: [],
  docSearchQuery: "",
  docSearchMatches: [],
  docSearchActiveIndex: -1,
  selectedTags: [],
  reviewStaleDays: 45,
  feedbackUrl: "https://github.com/Mobin-Karam/bastak-school/issues/new",
  dailyNotes: {
    yesterday: "",
    tomorrow: "",
    future: ""
  },
  dailyTasks: {
    yesterday: [],
    tomorrow: [],
    future: []
  },
  dragTask: null,
  personalityChecklist: {
    dateKey: "",
    doneMap: {}
  }
};

const fileTreeEl = document.getElementById("fileTree");
const contentEl = document.querySelector(".content");
const contentHeaderEl = document.querySelector(".content-header");
const docTitleEl = document.getElementById("docTitle");
const docSubtitleEl = document.getElementById("docSubtitle");
const docMetaEl = document.getElementById("docMeta");
const docMetaCardsEl = document.getElementById("docMetaCards");
const docContentEl = document.getElementById("docContent");
const docSearchSectionEl = document.getElementById("docSearchSection");
const docSearchInputEl = document.getElementById("docSearchInput");
const docSearchCountEl = document.getElementById("docSearchCount");
const docSearchPrevBtnEl = document.getElementById("docSearchPrevBtn");
const docSearchNextBtnEl = document.getElementById("docSearchNextBtn");
const docSearchClearBtnEl = document.getElementById("docSearchClearBtn");
const homeDashboardEl = document.getElementById("homeDashboard");
const journeyBoardEl = document.getElementById("journeyBoard");
const dashboardDateLabelEl = document.getElementById("dashboardDateLabel");
const dashboardFocusSummaryEl = document.getElementById("dashboardFocusSummary");
const yesterdayNotesInputEl = document.getElementById("yesterdayNotesInput");
const tomorrowNotesInputEl = document.getElementById("tomorrowNotesInput");
const futureNotesInputEl = document.getElementById("futureNotesInput");
const yesterdayTaskInputEl = document.getElementById("yesterdayTaskInput");
const tomorrowTaskInputEl = document.getElementById("tomorrowTaskInput");
const futureTaskInputEl = document.getElementById("futureTaskInput");
const yesterdayTaskAddBtnEl = document.getElementById("yesterdayTaskAddBtn");
const tomorrowTaskAddBtnEl = document.getElementById("tomorrowTaskAddBtn");
const futureTaskAddBtnEl = document.getElementById("futureTaskAddBtn");
const yesterdayTaskListEl = document.getElementById("yesterdayTaskList");
const tomorrowTaskListEl = document.getElementById("tomorrowTaskList");
const futureTaskListEl = document.getElementById("futureTaskList");
const pastDocsListEl = document.getElementById("pastDocsList");
const tomorrowDocsListEl = document.getElementById("tomorrowDocsList");
const futureDocsListEl = document.getElementById("futureDocsList");
const personalityWorkflowListEl = document.getElementById("personalityWorkflowList");
const personalityChecklistEl = document.getElementById("personalityChecklist");
const personalityChecklistProgressEl = document.getElementById("personalityChecklistProgress");
const seedTomorrowFromChecklistBtnEl = document.getElementById("seedTomorrowFromChecklistBtn");
const rawLinkEl = document.getElementById("rawLink");
const feedbackLinkEl = document.getElementById("feedbackLink");
const filterInputEl = document.getElementById("filterInput");
const clearFilterBtnEl = document.getElementById("clearFilterBtn");
const tagFilterInputEl = document.getElementById("tagFilterInput");
const clearTagFilterBtnEl = document.getElementById("clearTagFilterBtn");
const scopeSelectEl = document.getElementById("scopeSelect");
const sortSelectEl = document.getElementById("sortSelect");
const expandGroupsBtnEl = document.getElementById("expandGroupsBtn");
const collapseGroupsBtnEl = document.getElementById("collapseGroupsBtn");
const sidebarToggleBtnEl = document.getElementById("sidebarToggleBtn");
const desktopSidebarToggleBtnEl = document.getElementById("desktopSidebarToggleBtn");
const mobileBackdropEl = document.getElementById("mobileBackdrop");
const fileCountLabelEl = document.getElementById("fileCountLabel");
const tagCountLabelEl = document.getElementById("tagCountLabel");
const tagListEl = document.getElementById("tagList");
const copyPathBtnEl = document.getElementById("copyPathBtn");
const copyLinkBtnEl = document.getElementById("copyLinkBtn");
const themeSelectEl = document.getElementById("themeSelect");
const viewerStatusBadgeEl = document.getElementById("viewerStatusBadge");
const backendStatusBadgeEl = document.getElementById("backendStatusBadge");
const recentSectionEl = document.getElementById("recentSection");
const recentListEl = document.getElementById("recentList");
const clearRecentBtnEl = document.getElementById("clearRecentBtn");
const recentlyUpdatedListEl = document.getElementById("recentlyUpdatedList");
const needsReviewListEl = document.getElementById("needsReviewList");
const toastContainerEl = document.getElementById("toastContainer");
const desktopTopBtnEl = document.getElementById("desktopTopBtn");
const tabMenuBtnEl = document.getElementById("tabMenuBtn");
const tabDocsBtnEl = document.getElementById("tabDocsBtn");
const tabAgentsBtnEl = document.getElementById("tabAgentsBtn");
const tabTopBtnEl = document.getElementById("tabTopBtn");

const toastManager = createToastManager(toastContainerEl, { durationMs: 2800, maxVisible: 4 });
const pluginManager = createPluginManager(window.DOCS_VIEWER_PLUGINS);
let statusTimer = null;
const systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
const personalityWorkflowTemplates = [
  {
    title: "Morning Focus",
    summary: "Choose intent and daily priorities before coding.",
    agents: ["docs/operations/developer-handbook.md", "docs/architecture/dependency-boundaries.md", "docs/operations/repository-runbook.md"]
  },
  {
    title: "Build Session",
    summary: "Shape architecture, execute implementation, and keep quality gates.",
    agents: ["docs/architecture/repository-architecture.md", "docs/components/backend-v2-http-api.md", "docs/operations/developer-handbook.md"]
  },
  {
    title: "Product Check",
    summary: "Validate user value and game/product dynamics.",
    agents: ["docs/platform/README.md", "docs/ADMIN_V2_CAPABILITY_MATRIX.md", "docs/architecture/dependency-boundaries.md"]
  },
  {
    title: "Release Readiness",
    summary: "Prepare deployment and production ownership checks.",
    agents: ["docs/components/backend-v2-http-api.md", "docs/operations/github-cicd.md", "docs/operations/developer-handbook.md"]
  }
];

const personalityChecklistTemplates = [
  {
    id: "product-outcome",
    title: "Product",
    prompt: "Define one user outcome you will move today.",
    taskText: "Define one user outcome for today.",
    agentPath: "docs/platform/README.md"
  },
  {
    id: "decision-frame",
    title: "Decision",
    prompt: "Pick the decision framework before coding tradeoffs.",
    taskText: "Pick today's decision framework before coding.",
    agentPath: "docs/architecture/dependency-boundaries.md"
  },
  {
    id: "architecture",
    title: "Engineering",
    prompt: "Record one architecture or API contract decision.",
    taskText: "Record one architecture or API contract decision.",
    agentPath: "docs/architecture/repository-architecture.md"
  },
  {
    id: "qa-risk",
    title: "QA",
    prompt: "Define test and risk checks for the main change.",
    taskText: "Define test and risk checks for today.",
    agentPath: "docs/operations/developer-handbook.md"
  },
  {
    id: "devops-health",
    title: "DevOps",
    prompt: "Check health, logs, and deploy-readiness signal.",
    taskText: "Check service health and deploy-readiness.",
    agentPath: "docs/operations/github-cicd.md"
  },
  {
    id: "learning-loop",
    title: "Learning",
    prompt: "Close the day with one learning captured in docs.",
    taskText: "Capture one learning note in docs.",
    agentPath: "docs/operations/repository-runbook.md"
  }
];

const dashboardTaskControls = {
  yesterday: {
    inputEl: yesterdayTaskInputEl,
    addBtnEl: yesterdayTaskAddBtnEl,
    listEl: yesterdayTaskListEl,
    emptyMessage: "No completed tasks yet."
  },
  tomorrow: {
    inputEl: tomorrowTaskInputEl,
    addBtnEl: tomorrowTaskAddBtnEl,
    listEl: tomorrowTaskListEl,
    emptyMessage: "No priorities added yet."
  },
  future: {
    inputEl: futureTaskInputEl,
    addBtnEl: futureTaskAddBtnEl,
    listEl: futureTaskListEl,
    emptyMessage: "No future tasks yet."
  }
};

function parseMarkdown(source) {
  if (window.marked && typeof window.marked.parse === "function") {
    return window.marked.parse(source);
  }
  if (typeof window.marked === "function") {
    return window.marked(source);
  }
  throw new Error("Local marked parser unavailable");
}

if (!window.marked) {
  docTitleEl.textContent = "Marked parser is unavailable";
  docSubtitleEl.textContent = "Failed to load local markdown parser script";
  docContentEl.textContent = "Run npm install and refresh this page.";
  throw new Error("Local marked parser unavailable");
}

if (typeof window.marked.setOptions === "function") {
  window.marked.setOptions({
    gfm: true,
    breaks: false
  });
} else if (window.marked.defaults) {
  window.marked.defaults.gfm = true;
  window.marked.defaults.breaks = false;
}

function isMobileLayout() {
  return window.matchMedia("(max-width: 1080px)").matches;
}

function toFileRecord(input) {
  if (typeof input === "string") {
    return {
      path: input,
      mtimeMs: 0,
      modifiedAt: "",
      tags: [],
      excerpt: "",
      searchText: input.toLowerCase(),
      metadata: {
        title: input,
        owner: "backend-team",
        status: "active",
        version: "1.0",
        lastReviewed: "",
        reviewState: "needs-review",
        daysSinceReview: null
      }
    };
  }

  if (!input || typeof input.path !== "string") {
    return null;
  }

  return {
    path: input.path,
    mtimeMs: typeof input.mtimeMs === "number" ? input.mtimeMs : 0,
    modifiedAt: typeof input.modifiedAt === "string" ? input.modifiedAt : "",
    tags: Array.isArray(input.tags)
      ? [...new Set(input.tags.map((tag) => normalizeTag(String(tag))).filter(Boolean))]
      : [],
    excerpt: typeof input.excerpt === "string" ? input.excerpt : "",
    searchText:
      typeof input.searchText === "string"
        ? input.searchText.toLowerCase()
        : `${input.path}`.toLowerCase(),
    metadata: {
      title:
        typeof input.metadata?.title === "string" && input.metadata.title.trim()
          ? input.metadata.title.trim()
          : input.path,
      owner:
        typeof input.metadata?.owner === "string" && input.metadata.owner.trim()
          ? input.metadata.owner.trim()
          : "backend-team",
      status:
        typeof input.metadata?.status === "string" && input.metadata.status.trim()
          ? input.metadata.status.trim().toLowerCase()
          : "active",
      version:
        typeof input.metadata?.version === "string" && input.metadata.version.trim()
          ? input.metadata.version.trim()
          : "1.0",
      lastReviewed:
        typeof input.metadata?.lastReviewed === "string" ? input.metadata.lastReviewed : "",
      reviewState:
        typeof input.metadata?.reviewState === "string" ? input.metadata.reviewState : "needs-review",
      daysSinceReview:
        typeof input.metadata?.daysSinceReview === "number" ? input.metadata.daysSinceReview : null
    }
  };
}

function getHashPath() {
  if (!window.location.hash) return "";
  return normalizePosixPath(decodeURIComponent(window.location.hash.replace(/^#/, "")));
}

function saveRecent() {
  localStorage.setItem(STORAGE.recent, JSON.stringify(state.recent));
}

function loadRecent() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE.recent) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => typeof item === "string");
  } catch {
    return [];
  }
}

function saveDailyNotes() {
  localStorage.setItem(STORAGE.notes, JSON.stringify(state.dailyNotes));
}

function loadDailyNotes() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE.notes) ?? "{}");
    return {
      yesterday: typeof parsed.yesterday === "string" ? parsed.yesterday : "",
      tomorrow: typeof parsed.tomorrow === "string" ? parsed.tomorrow : "",
      future: typeof parsed.future === "string" ? parsed.future : ""
    };
  } catch {
    return { yesterday: "", tomorrow: "", future: "" };
  }
}

function createDashboardTaskId() {
  return `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function sanitizeTaskText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeTaskRecord(input) {
  if (!input || typeof input !== "object") return null;
  const text = sanitizeTaskText(input.text);
  if (!text) return null;
  return {
    id: typeof input.id === "string" && input.id ? input.id : createDashboardTaskId(),
    text,
    done: Boolean(input.done),
    createdAt: typeof input.createdAt === "number" ? input.createdAt : Date.now()
  };
}

function saveDailyTasks() {
  localStorage.setItem(STORAGE.tasks, JSON.stringify(state.dailyTasks));
}

function loadDailyTasks() {
  const defaults = { yesterday: [], tomorrow: [], future: [] };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE.tasks) ?? "{}");
    for (const key of Object.keys(defaults)) {
      const list = Array.isArray(parsed?.[key]) ? parsed[key] : [];
      defaults[key] = list.map(normalizeTaskRecord).filter(Boolean).slice(0, 60);
    }
    return defaults;
  } catch {
    return defaults;
  }
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function saveDesktopSidebarPreference() {
  localStorage.setItem(STORAGE.desktopSidebarCollapsed, state.desktopSidebarCollapsed ? "1" : "0");
}

function loadDesktopSidebarPreference() {
  return localStorage.getItem(STORAGE.desktopSidebarCollapsed) === "1";
}

function savePersonalityChecklist() {
  localStorage.setItem(STORAGE.personalityChecklist, JSON.stringify(state.personalityChecklist));
}

function loadPersonalityChecklist() {
  const todayKey = getTodayKey();
  const defaults = { dateKey: todayKey, doneMap: {} };

  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE.personalityChecklist) ?? "{}");
    if (!parsed || typeof parsed !== "object") return defaults;
    if (typeof parsed.dateKey !== "string" || parsed.dateKey !== todayKey) return defaults;
    if (!parsed.doneMap || typeof parsed.doneMap !== "object") return defaults;

    const doneMap = {};
    for (const item of personalityChecklistTemplates) {
      doneMap[item.id] = Boolean(parsed.doneMap[item.id]);
    }
    return {
      dateKey: todayKey,
      doneMap
    };
  } catch {
    return defaults;
  }
}

function showToast(message, type = "info") {
  toastManager.show(message, type);
}

function runPluginHook(hookName, payload) {
  const errors = pluginManager.runHook(hookName, payload);
  if (!errors.length) return;

  for (const item of errors.slice(0, 2)) {
    showToast(`Plugin error (${item.plugin}): ${item.message}`, "warning");
  }
}

function updateFeedbackLink(path, title) {
  if (!feedbackLinkEl) return;
  const issueTitle = `[Docs] ${path}`;
  const body = [
    `Document: ${path}`,
    `Title: ${title}`,
    "",
    "What is wrong or missing?",
    "- ",
    "",
    "Suggested fix:",
    "- "
  ].join("\n");
  const query = new URLSearchParams({ title: issueTitle, body });
  feedbackLinkEl.href = `${state.feedbackUrl}?${query.toString()}`;
}

function renderDocMetaCards(metadata) {
  if (!docMetaCardsEl) return;
  docMetaCardsEl.innerHTML = "";
  if (!metadata) return;

  const cards = [
    { label: "Owner", value: metadata.owner || "backend-team" },
    { label: "Status", value: metadata.status || "active", tone: `meta-${metadata.status || "active"}` },
    { label: "Version", value: metadata.version || "1.0" },
    { label: "Last review", value: formatDateTime(metadata.lastReviewed) },
    {
      label: "Review",
      value:
        typeof metadata.daysSinceReview === "number"
          ? `${metadata.daysSinceReview}d ago`
          : "unknown",
      tone: metadata.reviewState === "needs-review" ? "meta-needs-review" : "meta-fresh"
    }
  ];

  for (const card of cards) {
    const itemEl = document.createElement("span");
    itemEl.className = `meta-card${card.tone ? ` ${card.tone}` : ""}`;
    itemEl.textContent = `${card.label}: ${card.value}`;
    docMetaCardsEl.appendChild(itemEl);
  }
}

function setStatusBadge(element, mode, text, title = "") {
  if (!element) return;
  let labelEl = element.querySelector(".status-label");
  if (!labelEl) {
    const dotEl = document.createElement("span");
    dotEl.className = "status-dot";
    dotEl.setAttribute("aria-hidden", "true");
    labelEl = document.createElement("span");
    labelEl.className = "status-label";
    element.textContent = "";
    element.appendChild(dotEl);
    element.appendChild(labelEl);
  }
  element.classList.remove("status-live", "status-offline", "status-checking");
  element.classList.add(
    mode === "live" ? "status-live" : mode === "offline" ? "status-offline" : "status-checking"
  );
  labelEl.textContent = text;
  element.title = title;
}

async function refreshViewerStatus() {
  try {
    const response = await fetch(`/api/status?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Status endpoint returned ${response.status}`);
    }

    const payload = await response.json();
    if (typeof payload.config?.feedbackUrl === "string" && payload.config.feedbackUrl.trim()) {
      state.feedbackUrl = payload.config.feedbackUrl.trim();
      if (state.currentPath) {
        updateFeedbackLink(state.currentPath, state.currentMetadata?.title || state.currentPath);
      }
    }
    if (typeof payload.config?.reviewStaleDays === "number" && payload.config.reviewStaleDays > 0) {
      state.reviewStaleDays = payload.config.reviewStaleDays;
    }
    const checkedAt = formatDateTime(new Date().toISOString());
    const uptime = formatUptime(payload.uptimeSeconds);
    setStatusBadge(viewerStatusBadgeEl, "live", "Docs: live", `Checked ${checkedAt} | Uptime ${uptime}`);

    if (payload.backend?.ok) {
      const backendLatency = Number(payload.backend.latencyMs) || 0;
      const backendStatus = Number(payload.backend.status) || 0;
      const backendUrl = String(payload.backend.url || "");
      setStatusBadge(
        backendStatusBadgeEl,
        "live",
        "Backend: live",
        `Checked ${checkedAt} | ${backendStatus} in ${backendLatency}ms | ${backendUrl}`
      );
    } else {
      const backendLatency = Number(payload.backend?.latencyMs) || 0;
      const backendStatus = Number(payload.backend?.status) || 0;
      const backendUrl = String(payload.backend?.url || "");
      const backendError = String(payload.backend?.error || "No response");
      setStatusBadge(
        backendStatusBadgeEl,
        "offline",
        "Backend: offline",
        `Checked ${checkedAt} | ${backendStatus} in ${backendLatency}ms | ${backendUrl} | ${backendError}`
      );
    }
  } catch (error) {
    const checkedAt = formatDateTime(new Date().toISOString());
    setStatusBadge(
      viewerStatusBadgeEl,
      "offline",
      "Docs: offline",
      `Checked ${checkedAt} | ${String(error instanceof Error ? error.message : error)}`
    );
    setStatusBadge(
      backendStatusBadgeEl,
      "offline",
      "Backend: unknown",
      `Checked ${checkedAt} | Status request failed`
    );
  }
}

async function copyText(text, button, successMessage = "Copied") {
  const original = button?.textContent;
  if (button) button.disabled = true;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const fallback = document.createElement("textarea");
      fallback.value = text;
      fallback.style.position = "fixed";
      fallback.style.opacity = "0";
      document.body.appendChild(fallback);
      fallback.focus();
      fallback.select();
      document.execCommand("copy");
      fallback.remove();
    }

    if (button) button.textContent = "Copied";
    showToast(successMessage, "success");
  } catch {
    if (button) button.textContent = "Failed";
    showToast("Copy failed", "error");
  }

  if (button) {
    setTimeout(() => {
      button.textContent = original;
      button.disabled = false;
    }, 1100);
  }
}

function addRecent(path) {
  state.recent = [path, ...state.recent.filter((item) => item !== path)].slice(0, 8);
  saveRecent();
  renderRecent();
}

function renderRecent() {
  recentListEl.innerHTML = "";
  if (!state.recent.length) {
    recentSectionEl.classList.add("hidden");
    return;
  }

  recentSectionEl.classList.remove("hidden");
  for (const item of state.recent) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip-btn";
    button.textContent = item;
    button.title = item;
    button.addEventListener("click", () => void openDoc(item, true));
    recentListEl.appendChild(button);
  }
}

function saveThemePreference() {
  localStorage.setItem(STORAGE.theme, state.themePreference);
}

function applyTheme() {
  const resolved =
    state.themePreference === "system"
      ? systemThemeMedia.matches
        ? "dark"
        : "light"
      : state.themePreference;

  document.documentElement.dataset.theme = resolved;
  themeSelectEl.value = state.themePreference;
}

function loadTheme() {
  const stored = localStorage.getItem(STORAGE.theme);
  if (stored === "light" || stored === "dark" || stored === "system") {
    state.themePreference = stored;
  } else {
    state.themePreference = "system";
  }
  applyTheme();
}

function updateDesktopSidebarToggleButton() {
  if (!desktopSidebarToggleBtnEl) return;
  const collapsed = Boolean(state.desktopSidebarCollapsed);
  desktopSidebarToggleBtnEl.textContent = collapsed ? "Show sidebar" : "Hide sidebar";
  desktopSidebarToggleBtnEl.setAttribute("aria-expanded", String(!collapsed));
  desktopSidebarToggleBtnEl.title = collapsed
    ? "Expand docs navigation sidebar"
    : "Collapse docs navigation sidebar";
}

function applyDesktopSidebarState() {
  document.body.classList.toggle("desktop-sidebar-collapsed", Boolean(state.desktopSidebarCollapsed));
  updateDesktopSidebarToggleButton();
}

function toggleDesktopSidebar() {
  state.desktopSidebarCollapsed = !state.desktopSidebarCollapsed;
  saveDesktopSidebarPreference();
  applyDesktopSidebarState();
}

function setSidebarOpen(open) {
  state.sidebarOpen = open;
  document.body.classList.toggle("sidebar-open", open && isMobileLayout());
  updateMobileTabbarState();
}

function syncLayout() {
  if (!isMobileLayout()) {
    setSidebarOpen(false);
  }
  applyDesktopSidebarState();
  updateDesktopTopButton();
  updateContentHeaderScrollState();
}

function updateMobileTabbarState() {
  if (!tabMenuBtnEl || !tabDocsBtnEl || !tabAgentsBtnEl || !tabTopBtnEl) return;

  tabMenuBtnEl.classList.toggle("active", Boolean(state.sidebarOpen && isMobileLayout()));
  tabDocsBtnEl.classList.toggle("active", state.currentPath.startsWith("docs/"));
  tabAgentsBtnEl.classList.toggle("active", state.currentPath.startsWith("agents/"));
  tabTopBtnEl.classList.remove("active");
}

function updateDesktopTopButton() {
  if (!desktopTopBtnEl) return;
  const show = !isMobileLayout() && window.scrollY > 180;
  desktopTopBtnEl.classList.toggle("show", show);
}

function updateContentHeaderScrollState() {
  if (!contentHeaderEl) return;
  contentHeaderEl.classList.toggle("is-scrolled", window.scrollY > 18);
  if (!contentEl) return;
  const headerHeight = Math.max(0, Math.round(contentHeaderEl.getBoundingClientRect().height));
  contentEl.style.setProperty("--content-header-height", `${headerHeight}px`);
}

function isExternalHref(href) {
  const trimmed = String(href ?? "").trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("//")) return true;
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
}

function isLocalNavigableHref(href) {
  const trimmed = String(href ?? "").trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("#")) return false;
  return !isExternalHref(trimmed);
}

function resolveMarkdownLink(currentPath, href) {
  if (!isLocalNavigableHref(href)) {
    return null;
  }

  const pathPart = href.split("#")[0].split("?")[0];
  if (!pathPart.endsWith(".md")) {
    return null;
  }

  const currentDir = currentPath.includes("/")
    ? currentPath.slice(0, currentPath.lastIndexOf("/") + 1)
    : "";

  const resolved = pathPart.startsWith("/")
    ? normalizePosixPath(pathPart.slice(1))
    : normalizePosixPath(`${currentDir}${pathPart}`);

  if (!(resolved.startsWith("docs/") || resolved.startsWith("agents/"))) {
    return null;
  }

  return resolved;
}

function isEditorLinkCandidate(href) {
  if (!isLocalNavigableHref(href)) return false;
  const pathPart = String(href).split("#")[0].split("?")[0].trim();
  return Boolean(pathPart);
}

function buildEditorLinkUrl(fromPath, href, redirect = true) {
  const query = new URLSearchParams({
    from: fromPath,
    href,
    redirect: redirect ? "1" : "0"
  });
  return `/api/editor/link?${query.toString()}`;
}

function setDocSearchVisibility(visible) {
  if (!docSearchSectionEl) return;
  docSearchSectionEl.classList.toggle("hidden", !visible);
}

function clearDocSearchHighlights() {
  const highlights = docContentEl.querySelectorAll("mark.doc-search-hit");
  for (const highlight of highlights) {
    const parent = highlight.parentNode;
    if (!parent) continue;
    parent.replaceChild(document.createTextNode(highlight.textContent ?? ""), highlight);
    parent.normalize();
  }
}

function updateDocSearchUi() {
  const hasQuery = Boolean(state.docSearchQuery);
  const total = state.docSearchMatches.length;
  const hasMatch = total > 0;

  if (docSearchCountEl) {
    if (!hasQuery) {
      docSearchCountEl.textContent = "Type to search in this document";
    } else if (!hasMatch) {
      docSearchCountEl.textContent = "No matches";
    } else {
      docSearchCountEl.textContent = `${state.docSearchActiveIndex + 1} of ${total} matches`;
    }
  }

  if (docSearchPrevBtnEl) docSearchPrevBtnEl.disabled = !hasMatch;
  if (docSearchNextBtnEl) docSearchNextBtnEl.disabled = !hasMatch;
  if (docSearchClearBtnEl) docSearchClearBtnEl.disabled = !hasQuery;
}

function resetDocSearchState(options = {}) {
  const clearInput = options.clearInput !== false;
  const clearHighlights = options.clearHighlights !== false;

  if (clearHighlights) {
    clearDocSearchHighlights();
  }

  state.docSearchMatches = [];
  state.docSearchActiveIndex = -1;
  state.docSearchQuery = clearInput ? "" : state.docSearchQuery;

  if (clearInput && docSearchInputEl) {
    docSearchInputEl.value = "";
  }

  updateDocSearchUi();
}

function setActiveDocSearchMatch(index, options = {}) {
  const scroll = options.scroll !== false;
  const total = state.docSearchMatches.length;
  if (!total) {
    state.docSearchActiveIndex = -1;
    updateDocSearchUi();
    return;
  }

  const normalized = ((index % total) + total) % total;
  state.docSearchActiveIndex = normalized;

  state.docSearchMatches.forEach((item, itemIndex) => {
    item.classList.toggle("is-active", itemIndex === normalized);
  });

  const current = state.docSearchMatches[normalized];
  if (scroll && current) {
    current.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  }

  updateDocSearchUi();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightDocSearch(query, options = {}) {
  const scrollToFirst = options.scrollToFirst !== false;
  const normalizedQuery = String(query ?? "").trim();
  state.docSearchQuery = normalizedQuery;

  clearDocSearchHighlights();
  state.docSearchMatches = [];
  state.docSearchActiveIndex = -1;

  if (!normalizedQuery) {
    updateDocSearchUi();
    return;
  }

  const pattern = new RegExp(escapeRegExp(normalizedQuery), "gi");
  const walker = document.createTreeWalker(docContentEl, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const text = node.nodeValue ?? "";
      if (!text.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest(".code-toolbar")) return NodeFilter.FILTER_REJECT;
      if (parent.closest("script, style, textarea")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  for (const node of textNodes) {
    const source = node.nodeValue ?? "";
    pattern.lastIndex = 0;
    if (!pattern.test(source)) continue;

    const fragment = document.createDocumentFragment();
    let cursor = 0;
    pattern.lastIndex = 0;
    let match = pattern.exec(source);

    while (match) {
      const index = match.index;
      const matchedText = match[0];
      if (index > cursor) {
        fragment.appendChild(document.createTextNode(source.slice(cursor, index)));
      }

      const mark = document.createElement("mark");
      mark.className = "doc-search-hit";
      mark.textContent = matchedText;
      fragment.appendChild(mark);
      state.docSearchMatches.push(mark);

      cursor = index + matchedText.length;
      match = pattern.exec(source);
    }

    if (cursor < source.length) {
      fragment.appendChild(document.createTextNode(source.slice(cursor)));
    }

    node.parentNode?.replaceChild(fragment, node);
  }

  if (state.docSearchMatches.length) {
    setActiveDocSearchMatch(0, { scroll: scrollToFirst });
  } else {
    updateDocSearchUi();
  }
}

function sortFiles(files) {
  const copy = [...files];
  copy.sort((left, right) => {
    if (state.sort === "name-asc") {
      return left.path.localeCompare(right.path, undefined, { sensitivity: "base" });
    }
    if (state.sort === "name-desc") {
      return right.path.localeCompare(left.path, undefined, { sensitivity: "base" });
    }
    if (state.sort === "date-asc") {
      if (left.mtimeMs !== right.mtimeMs) return left.mtimeMs - right.mtimeMs;
      return left.path.localeCompare(right.path, undefined, { sensitivity: "base" });
    }

    if (left.mtimeMs !== right.mtimeMs) return right.mtimeMs - left.mtimeMs;
    return left.path.localeCompare(right.path, undefined, { sensitivity: "base" });
  });
  return copy;
}

function getScopedFiles() {
  return state.files.filter((file) => {
    if (state.scope === "all") return true;
    return file.path.startsWith(`${state.scope}/`);
  });
}

function matchesTextFilter(file, value) {
  if (!value) return true;
  if (file.path.toLowerCase().includes(value)) return true;
  if (file.tags.some((tag) => tag.includes(value))) return true;
  if (file.searchText && file.searchText.includes(value)) return true;
  if (file.excerpt && file.excerpt.toLowerCase().includes(value)) return true;
  if (file.metadata?.title && file.metadata.title.toLowerCase().includes(value)) return true;
  if (file.metadata?.owner && file.metadata.owner.toLowerCase().includes(value)) return true;
  if (file.metadata?.status && file.metadata.status.toLowerCase().includes(value)) return true;
  return false;
}

function matchesTagSearch(file, value) {
  if (!value) return true;
  return file.tags.some((tag) => tag.includes(value));
}

function matchesSelectedTags(file, tags) {
  if (!tags.length) return true;
  return tags.every((tag) => file.tags.includes(tag));
}

function getFilteredFiles() {
  const textValue = state.filter.trim().toLowerCase();
  const tagSearchValue = normalizeTag(state.tagFilter);
  const filtered = getScopedFiles().filter((file) => {
    if (!matchesTextFilter(file, textValue)) return false;
    if (!matchesTagSearch(file, tagSearchValue)) return false;
    if (!matchesSelectedTags(file, state.selectedTags)) return false;
    return true;
  });

  return sortFiles(filtered);
}

function getTagCounts(files) {
  const tagCounts = new Map();
  for (const file of files) {
    for (const tag of file.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  return tagCounts;
}

function renderTags() {
  if (!tagListEl || !tagCountLabelEl) return;

  const textValue = state.filter.trim().toLowerCase();
  const tagSearchValue = normalizeTag(state.tagFilter);
  const scoped = getScopedFiles().filter((file) => matchesTextFilter(file, textValue));
  const counts = getTagCounts(scoped);
  const allTags = [...counts.entries()]
    .filter(([tag]) => !tagSearchValue || tag.includes(tagSearchValue))
    .sort((left, right) => {
      if (right[1] !== left[1]) return right[1] - left[1];
      return left[0].localeCompare(right[0]);
    });

  tagCountLabelEl.textContent = `${allTags.length} tags`;
  tagListEl.innerHTML = "";

  if (!allTags.length) {
    const empty = document.createElement("p");
    empty.className = "tag-empty";
    empty.textContent = "No tags match current filters.";
    tagListEl.appendChild(empty);
    return;
  }

  for (const [tag, count] of allTags) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chip-btn tag-chip${state.selectedTags.includes(tag) ? " active" : ""}`;
    button.title = `${tag} (${count} files)`;
    button.textContent = `#${tag} (${count})`;
    button.addEventListener("click", () => {
      if (state.selectedTags.includes(tag)) {
        state.selectedTags = state.selectedTags.filter((item) => item !== tag);
      } else {
        state.selectedTags = [...state.selectedTags, tag].sort();
      }
      renderFileTree();
    });
    tagListEl.appendChild(button);
  }
}

function renderInsightList(containerEl, files, emptyMessage) {
  if (!containerEl) return;
  containerEl.innerHTML = "";
  if (!files.length) {
    const emptyEl = document.createElement("p");
    emptyEl.className = "tag-empty";
    emptyEl.textContent = emptyMessage;
    containerEl.appendChild(emptyEl);
    return;
  }

  for (const file of files) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip-btn insight-chip";
    button.title = `${file.path} | ${file.excerpt || "No summary available"}`;
    button.textContent = file.metadata?.title || file.path;
    button.addEventListener("click", () => void openDoc(file.path, true));
    containerEl.appendChild(button);
  }
}

function renderInsights() {
  const scoped = getScopedFiles();
  const recentlyUpdated = [...scoped]
    .sort((left, right) => right.mtimeMs - left.mtimeMs)
    .slice(0, 5);
  const needsReview = scoped
    .filter((file) => file.metadata?.reviewState === "needs-review")
    .sort((left, right) => right.mtimeMs - left.mtimeMs)
    .slice(0, 5);

  renderInsightList(recentlyUpdatedListEl, recentlyUpdated, "No recent documents.");
  renderInsightList(needsReviewListEl, needsReview, "No docs need review.");
}

function isHomeDashboardPath(pathname) {
  return pathname === "docs/README.md";
}

function toDisplayDateLabel() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date());
}

function getDashboardColumnTasks(columnKey) {
  const tasks = state.dailyTasks[columnKey];
  return Array.isArray(tasks) ? tasks : [];
}

function clearDashboardTaskDropHighlights() {
  for (const control of Object.values(dashboardTaskControls)) {
    if (!control?.listEl) continue;
    control.listEl.classList.remove("task-list-drop-active");
  }
}

function moveDashboardTask(fromColumnKey, toColumnKey, taskId, options = {}) {
  if (fromColumnKey === toColumnKey) return false;

  const sourceTasks = [...getDashboardColumnTasks(fromColumnKey)];
  const taskIndex = sourceTasks.findIndex((task) => task.id === taskId);
  if (taskIndex === -1) return false;

  const [task] = sourceTasks.splice(taskIndex, 1);
  const targetTasks = getDashboardColumnTasks(toColumnKey);

  state.dailyTasks[fromColumnKey] = sourceTasks;
  state.dailyTasks[toColumnKey] = [task, ...targetTasks].slice(0, 60);
  saveDailyTasks();
  renderDashboardTaskList(fromColumnKey);
  renderDashboardTaskList(toColumnKey);
  renderDashboardFocusSummary();

  if (options.notify !== false) {
    showToast(`Moved task to ${toColumnKey}`, "success");
  }
  return true;
}

function beginDashboardTaskDrag(columnKey, taskId, event) {
  state.dragTask = { columnKey, taskId };
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `${columnKey}:${taskId}`);
  }

  const element = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  if (element) {
    element.classList.add("is-dragging");
  }
}

function endDashboardTaskDrag(event) {
  state.dragTask = null;
  clearDashboardTaskDropHighlights();
  const element = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  if (element) {
    element.classList.remove("is-dragging");
  }
}

function setupDashboardTaskDropZones() {
  for (const [columnKey, control] of Object.entries(dashboardTaskControls)) {
    if (!control?.listEl || control.listEl.dataset.dragBound === "1") continue;
    control.listEl.dataset.dragBound = "1";

    control.listEl.addEventListener("dragover", (event) => {
      if (!state.dragTask) return;
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
      control.listEl.classList.add("task-list-drop-active");
    });

    control.listEl.addEventListener("dragleave", () => {
      control.listEl.classList.remove("task-list-drop-active");
    });

    control.listEl.addEventListener("drop", (event) => {
      event.preventDefault();
      control.listEl.classList.remove("task-list-drop-active");
      const dragTask = state.dragTask;
      if (!dragTask) return;
      moveDashboardTask(dragTask.columnKey, columnKey, dragTask.taskId, { notify: true });
      state.dragTask = null;
    });
  }
}

function renderDashboardTaskList(columnKey) {
  const control = dashboardTaskControls[columnKey];
  if (!control?.listEl) return;

  const tasks = getDashboardColumnTasks(columnKey);
  control.listEl.innerHTML = "";

  if (!tasks.length) {
    const emptyEl = document.createElement("p");
    emptyEl.className = "dashboard-empty dashboard-task-empty";
    emptyEl.textContent = control.emptyMessage;
    control.listEl.appendChild(emptyEl);
    return;
  }

  for (const task of tasks) {
    const itemEl = document.createElement("article");
    itemEl.className = `dashboard-task${task.done ? " is-done" : ""}`;
    itemEl.draggable = true;
    itemEl.addEventListener("dragstart", (event) => {
      beginDashboardTaskDrag(columnKey, task.id, event);
    });
    itemEl.addEventListener("dragend", (event) => {
      endDashboardTaskDrag(event);
    });

    const checkWrapEl = document.createElement("label");
    checkWrapEl.className = "task-check-wrap";

    const checkEl = document.createElement("input");
    checkEl.type = "checkbox";
    checkEl.className = "task-check";
    checkEl.checked = task.done;
    checkEl.setAttribute("aria-label", `Mark "${task.text}" complete`);
    checkEl.addEventListener("change", () => {
      toggleDashboardTask(columnKey, task.id, checkEl.checked);
    });

    const textEl = document.createElement("span");
    textEl.className = "task-text";
    textEl.textContent = task.text;

    checkWrapEl.appendChild(checkEl);
    checkWrapEl.appendChild(textEl);

    const removeBtnEl = document.createElement("button");
    removeBtnEl.type = "button";
    removeBtnEl.className = "task-remove-btn";
    removeBtnEl.textContent = "Remove";
    removeBtnEl.setAttribute("aria-label", `Remove task "${task.text}"`);
    removeBtnEl.addEventListener("click", () => {
      removeDashboardTask(columnKey, task.id);
    });

    itemEl.appendChild(checkWrapEl);
    itemEl.appendChild(removeBtnEl);
    control.listEl.appendChild(itemEl);
  }
}

function renderAllDashboardTaskLists() {
  for (const key of Object.keys(dashboardTaskControls)) {
    renderDashboardTaskList(key);
  }
}

function hasDashboardTaskText(columnKey, text) {
  const tasks = getDashboardColumnTasks(columnKey);
  const normalized = sanitizeTaskText(text).toLowerCase();
  if (!normalized) return false;
  return tasks.some((task) => sanitizeTaskText(task.text).toLowerCase() === normalized);
}

function addDashboardTaskItem(columnKey, rawText, options = {}) {
  const text = sanitizeTaskText(rawText);
  if (!text) {
    return false;
  }

  if (hasDashboardTaskText(columnKey, text)) {
    if (options.notifyOnDuplicate !== false) {
      showToast("Task already exists in this column", "info");
    }
    return false;
  }

  const nextTask = {
    id: createDashboardTaskId(),
    text,
    done: Boolean(options.done),
    createdAt: Date.now()
  };
  const existing = getDashboardColumnTasks(columnKey);
  state.dailyTasks[columnKey] = [nextTask, ...existing].slice(0, 60);
  saveDailyTasks();
  renderDashboardTaskList(columnKey);
  renderDashboardFocusSummary();
  return true;
}

function addDashboardTask(columnKey) {
  const control = dashboardTaskControls[columnKey];
  if (!control?.inputEl) return;
  const text = sanitizeTaskText(control.inputEl.value);
  if (!text) {
    showToast("Enter a task first", "warning");
    control.inputEl.focus();
    return;
  }

  const added = addDashboardTaskItem(columnKey, text);
  if (added) {
    control.inputEl.value = "";
  }
}

function toggleDashboardTask(columnKey, taskId, done) {
  const tasks = getDashboardColumnTasks(columnKey);
  let hasChanges = false;
  state.dailyTasks[columnKey] = tasks.map((task) => {
    if (task.id !== taskId) return task;
    hasChanges = true;
    return { ...task, done };
  });
  if (!hasChanges) return;
  saveDailyTasks();
  renderDashboardTaskList(columnKey);
  renderDashboardFocusSummary();
}

function removeDashboardTask(columnKey, taskId) {
  const tasks = getDashboardColumnTasks(columnKey);
  const next = tasks.filter((task) => task.id !== taskId);
  if (next.length === tasks.length) return;
  state.dailyTasks[columnKey] = next;
  saveDailyTasks();
  renderDashboardTaskList(columnKey);
  renderDashboardFocusSummary();
}

function normalizePersonalityChecklist() {
  const todayKey = getTodayKey();
  let changed = false;
  if (state.personalityChecklist.dateKey !== todayKey) {
    state.personalityChecklist = { dateKey: todayKey, doneMap: {} };
    changed = true;
  }
  if (!state.personalityChecklist.doneMap || typeof state.personalityChecklist.doneMap !== "object") {
    state.personalityChecklist.doneMap = {};
    changed = true;
  }

  for (const item of personalityChecklistTemplates) {
    if (typeof state.personalityChecklist.doneMap[item.id] !== "boolean") {
      state.personalityChecklist.doneMap[item.id] = false;
      changed = true;
    }
  }

  if (changed) {
    savePersonalityChecklist();
  }
}

function setPersonalityChecklistDone(itemId, done) {
  normalizePersonalityChecklist();
  state.personalityChecklist.doneMap[itemId] = Boolean(done);
  savePersonalityChecklist();
  renderPersonalityChecklist();
  renderDashboardFocusSummary();
}

function getPersonalityChecklistStats() {
  normalizePersonalityChecklist();
  const total = personalityChecklistTemplates.length;
  let done = 0;
  for (const item of personalityChecklistTemplates) {
    if (state.personalityChecklist.doneMap[item.id]) done += 1;
  }
  return { done, total };
}

function renderPersonalityChecklist() {
  if (!personalityChecklistEl) return;
  normalizePersonalityChecklist();
  personalityChecklistEl.innerHTML = "";

  for (const item of personalityChecklistTemplates) {
    const done = Boolean(state.personalityChecklist.doneMap[item.id]);
    const rowEl = document.createElement("article");
    rowEl.className = `personality-check-item${done ? " is-done" : ""}`;

    const labelEl = document.createElement("label");
    labelEl.className = "personality-check-label";

    const checkEl = document.createElement("input");
    checkEl.type = "checkbox";
    checkEl.className = "task-check";
    checkEl.checked = done;
    checkEl.setAttribute("aria-label", `Complete personality check ${item.title}`);
    checkEl.addEventListener("change", () => {
      setPersonalityChecklistDone(item.id, checkEl.checked);
    });

    const textWrapEl = document.createElement("span");
    textWrapEl.className = "personality-check-text";

    const titleEl = document.createElement("span");
    titleEl.className = "personality-check-title";
    titleEl.textContent = item.title;

    const promptEl = document.createElement("span");
    promptEl.className = "personality-check-prompt";
    promptEl.textContent = item.prompt;

    textWrapEl.appendChild(titleEl);
    textWrapEl.appendChild(promptEl);
    labelEl.appendChild(checkEl);
    labelEl.appendChild(textWrapEl);

    const actionsEl = document.createElement("div");
    actionsEl.className = "personality-check-actions";

    const addTaskBtnEl = document.createElement("button");
    addTaskBtnEl.type = "button";
    addTaskBtnEl.className = "task-remove-btn";
    addTaskBtnEl.textContent = "Task";
    addTaskBtnEl.title = "Add this check as a tomorrow task";
    addTaskBtnEl.addEventListener("click", () => {
      const added = addDashboardTaskItem("tomorrow", item.taskText, { notifyOnDuplicate: true });
      if (added) {
        showToast("Added to Tomorrow tasks", "success");
      }
    });
    actionsEl.appendChild(addTaskBtnEl);

    const agentFile = state.files.find((file) => file.path === item.agentPath);
    if (agentFile) {
      const openBtnEl = document.createElement("button");
      openBtnEl.type = "button";
      openBtnEl.className = "task-remove-btn";
      openBtnEl.textContent = "Agent";
      openBtnEl.title = `Open ${agentFile.metadata?.title || agentFile.path}`;
      openBtnEl.addEventListener("click", () => {
        void openDoc(agentFile.path, true);
      });
      actionsEl.appendChild(openBtnEl);
    }

    rowEl.appendChild(labelEl);
    rowEl.appendChild(actionsEl);
    personalityChecklistEl.appendChild(rowEl);
  }

  const stats = getPersonalityChecklistStats();
  if (personalityChecklistProgressEl) {
    personalityChecklistProgressEl.textContent = `${stats.done} of ${stats.total} done`;
  }
}

function addUncheckedPersonalityItemsToTomorrow() {
  normalizePersonalityChecklist();
  let addedCount = 0;
  for (const item of personalityChecklistTemplates) {
    if (state.personalityChecklist.doneMap[item.id]) continue;
    const added = addDashboardTaskItem("tomorrow", item.taskText, { notifyOnDuplicate: false });
    if (added) addedCount += 1;
  }

  if (addedCount > 0) {
    showToast(`Added ${addedCount} checklist task${addedCount > 1 ? "s" : ""}`, "success");
  } else {
    showToast("No new checklist tasks to add", "info");
  }
}

function getDashboardTaskStats() {
  const columns = ["yesterday", "tomorrow", "future"];
  let total = 0;
  let done = 0;
  let tomorrowOpen = 0;
  for (const key of columns) {
    const tasks = getDashboardColumnTasks(key);
    total += tasks.length;
    done += tasks.filter((task) => task.done).length;
    if (key === "tomorrow") {
      tomorrowOpen = tasks.filter((task) => !task.done).length;
    }
  }
  return { total, done, tomorrowOpen };
}

function renderDashboardFocusSummary() {
  if (!dashboardFocusSummaryEl) return;
  const taskStats = getDashboardTaskStats();
  const checklistStats = getPersonalityChecklistStats();
  dashboardFocusSummaryEl.textContent =
    `Tasks done ${taskStats.done}/${taskStats.total || 0} | Tomorrow open ${taskStats.tomorrowOpen} | ` +
    `Standards ${checklistStats.done}/${checklistStats.total}`;
}

function resolveJourneyFiles(paths) {
  return paths
    .map((path) => state.files.find((file) => file.path === path))
    .filter((file) => Boolean(file));
}

function createJourneyStepButton(file, stepIndex) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "journey-step-btn";
  button.title = file.path;

  const indexEl = document.createElement("span");
  indexEl.className = "journey-step-index";
  indexEl.textContent = String(stepIndex);

  const labelEl = document.createElement("span");
  labelEl.className = "journey-step-label";
  labelEl.textContent = file.metadata?.title || file.path;

  button.appendChild(indexEl);
  button.appendChild(labelEl);
  button.addEventListener("click", () => void openDoc(file.path, true));
  return button;
}

function getJourneyRoutes() {
  return [
    {
      title: "Start Here",
      summary: "First read for any new developer joining the backend.",
      paths: ["docs/operations/developer-handbook.md", "docs/architecture/repository-architecture.md", "docs/architecture/dependency-boundaries.md"]
    },
    {
      title: "Build Features",
      summary: "Understand platform modules, API behavior and Admin capabilities.",
      paths: ["docs/platform/README.md", "docs/components/backend-v2-http-api.md", "docs/ADMIN_V2_CAPABILITY_MATRIX.md", "docs/architecture/backend-v2-design.md"]
    },
    {
      title: "Student Application",
      summary: "Understand the Student runtime, shared core and API contracts.",
      paths: [
        "docs/architecture/student-v2-tauri-runtime.md",
        "docs/architecture/student-core-boundary.md",
        "docs/components/backend-v2-http-api.md"
      ]
    },
    {
      title: "Operate in Production",
      summary: "Admin control, moderation, deployment runbooks, and commit standards.",
      paths: ["docs/operations/repository-runbook.md", "docs/operations/developer-handbook.md", "docs/operations/github-cicd.md", "docs/architecture/workspace-foundation.md"]
    }
  ];
}

function renderJourneyBoard() {
  if (!journeyBoardEl) return;
  journeyBoardEl.innerHTML = "";
  const routes = getJourneyRoutes();

  for (const route of routes) {
    const files = resolveJourneyFiles(route.paths);
    if (!files.length) continue;

    const card = document.createElement("article");
    card.className = "journey-card";

    const titleEl = document.createElement("h4");
    titleEl.className = "journey-card-title";
    titleEl.textContent = route.title;

    const summaryEl = document.createElement("p");
    summaryEl.className = "journey-card-summary";
    summaryEl.textContent = route.summary;

    const stepsEl = document.createElement("div");
    stepsEl.className = "journey-steps";
    for (let i = 0; i < files.length; i += 1) {
      stepsEl.appendChild(createJourneyStepButton(files[i], i + 1));
    }

    const primaryCta = document.createElement("button");
    primaryCta.type = "button";
    primaryCta.className = "journey-primary-btn";
    primaryCta.textContent = `Open ${files[0].metadata?.title || files[0].path}`;
    primaryCta.addEventListener("click", () => void openDoc(files[0].path, true));

    card.appendChild(titleEl);
    card.appendChild(summaryEl);
    card.appendChild(stepsEl);
    card.appendChild(primaryCta);
    journeyBoardEl.appendChild(card);
  }
}

function createDashboardDocButton(file) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "dashboard-doc-btn";
  button.textContent = file.metadata?.title || file.path;
  const version = file.metadata?.version ? `v${file.metadata.version}` : "v1.0";
  const status = file.metadata?.status || "active";
  button.title = `${file.path} | ${status} | ${version}`;
  button.addEventListener("click", () => void openDoc(file.path, true));
  return button;
}

function renderDashboardDocList(containerEl, files, emptyMessage) {
  if (!containerEl) return;
  containerEl.innerHTML = "";
  if (!files.length) {
    const emptyEl = document.createElement("p");
    emptyEl.className = "dashboard-empty";
    emptyEl.textContent = emptyMessage;
    containerEl.appendChild(emptyEl);
    return;
  }

  for (const file of files) {
    containerEl.appendChild(createDashboardDocButton(file));
  }
}

function getRecentVisitedFiles(limit = 6) {
  const resolved = [];
  for (const path of state.recent) {
    const file = state.files.find((item) => item.path === path);
    if (file) {
      resolved.push(file);
    }
    if (resolved.length >= limit) break;
  }
  return resolved;
}

function getTomorrowPlanFiles(limit = 6) {
  const candidates = state.files
    .filter((file) => file.metadata?.reviewState === "needs-review" || file.metadata?.status === "draft")
    .sort((left, right) => right.mtimeMs - left.mtimeMs);
  return candidates.slice(0, limit);
}

function getFuturePlanFiles(limit = 6) {
  const candidates = state.files
    .filter((file) => {
      if (file.metadata?.status === "experimental") return true;
      if (file.metadata?.status === "draft") return true;
      return file.path.includes("backlog");
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs);
  return candidates.slice(0, limit);
}

function renderPersonalityWorkflow() {
  if (!personalityWorkflowListEl) return;
  personalityWorkflowListEl.innerHTML = "";

  for (const workflow of personalityWorkflowTemplates) {
    const wrap = document.createElement("section");
    wrap.className = "workflow-item";

    const title = document.createElement("p");
    title.className = "workflow-title";
    title.textContent = workflow.title;

    const summary = document.createElement("p");
    summary.className = "workflow-summary";
    summary.textContent = workflow.summary;

    const chips = document.createElement("div");
    chips.className = "workflow-chips";
    for (const agentPath of workflow.agents) {
      const agentFile = state.files.find((file) => file.path === agentPath);
      if (!agentFile) continue;
      chips.appendChild(createDashboardDocButton(agentFile));
    }

    wrap.appendChild(title);
    wrap.appendChild(summary);
    wrap.appendChild(chips);
    personalityWorkflowListEl.appendChild(wrap);
  }
}

function renderHomeDashboard() {
  if (!homeDashboardEl) return;
  const isHome = isHomeDashboardPath(state.currentPath);
  homeDashboardEl.classList.toggle("hidden", !isHome);
  if (!isHome) return;

  if (dashboardDateLabelEl) {
    dashboardDateLabelEl.textContent = toDisplayDateLabel();
  }
  renderJourneyBoard();
  renderAllDashboardTaskLists();

  const past = getRecentVisitedFiles(6);
  const tomorrow = getTomorrowPlanFiles(6);
  const future = getFuturePlanFiles(6);

  renderDashboardDocList(pastDocsListEl, past, "No recent activity yet.");
  renderDashboardDocList(tomorrowDocsListEl, tomorrow, "No tomorrow suggestions. You're clear.");
  renderDashboardDocList(futureDocsListEl, future, "No future backlog suggestions.");
  renderPersonalityWorkflow();
  renderPersonalityChecklist();
  renderDashboardFocusSummary();
  const taskStats = getDashboardTaskStats();
  const checklistStats = getPersonalityChecklistStats();

  runPluginHook("onHomeDashboardRendered", {
    pastCount: past.length,
    tomorrowCount: tomorrow.length,
    futureCount: future.length,
    journeyCount: journeyBoardEl ? journeyBoardEl.childElementCount : 0,
    tasksDone: taskStats.done,
    tasksTotal: taskStats.total,
    checklistDone: checklistStats.done,
    checklistTotal: checklistStats.total,
    path: state.currentPath
  });
}

function groupByRoot(files) {
  const groups = { docs: [], agents: [] };
  for (const file of files) {
    if (file.path.startsWith("docs/")) groups.docs.push(file);
    if (file.path.startsWith("agents/")) groups.agents.push(file);
  }
  return groups;
}

function buildFolderMap(rootName, files) {
  const buckets = new Map();
  for (const file of files) {
    const relative = file.path.slice(rootName.length + 1);
    const slashIndex = relative.indexOf("/");
    const folder = slashIndex === -1 ? "." : relative.slice(0, slashIndex);
    const list = buckets.get(folder) ?? [];
    list.push(file);
    buckets.set(folder, list);
  }

  const folders = Array.from(buckets.keys()).sort((left, right) => {
    if (left === ".") return -1;
    if (right === ".") return 1;
    return left.localeCompare(right);
  });

  return { buckets, folders };
}

function setButtonDisabledState() {
  const hasCurrent = Boolean(state.currentPath);
  copyPathBtnEl.disabled = !hasCurrent;
  copyLinkBtnEl.disabled = !hasCurrent;
}

function hasFilePath(path) {
  return state.files.some((file) => file.path === path);
}

function renderFileTree() {
  const filtered = getFilteredFiles();
  const selectedTagCount = state.selectedTags.length;
  fileCountLabelEl.textContent = `${filtered.length} / ${state.files.length} files${
    selectedTagCount ? ` | ${selectedTagCount} tag filter${selectedTagCount > 1 ? "s" : ""}` : ""
  }`;

  fileTreeEl.innerHTML = "";
  const groups = groupByRoot(filtered);
  let hasAny = false;

  for (const rootName of ["docs", "agents"]) {
    const files = groups[rootName];
    if (!files.length) continue;
    hasAny = true;

    const groupWrap = document.createElement("section");
    groupWrap.className = "tree-group";

    const groupHeader = document.createElement("button");
    groupHeader.type = "button";
    groupHeader.className = "tree-group-header";
    groupHeader.setAttribute("aria-expanded", String(state.groupOpen[rootName] !== false));

    const groupLeft = document.createElement("span");
    groupLeft.textContent = `${state.groupOpen[rootName] === false ? ">" : "v"} ${rootName}`;
    const groupCount = document.createElement("span");
    groupCount.className = "tree-group-count";
    groupCount.textContent = `${files.length}`;
    groupHeader.appendChild(groupLeft);
    groupHeader.appendChild(groupCount);
    groupHeader.addEventListener("click", () => {
      state.groupOpen[rootName] = !(state.groupOpen[rootName] !== false);
      renderFileTree();
    });

    groupWrap.appendChild(groupHeader);
    if (state.groupOpen[rootName] === false) {
      fileTreeEl.appendChild(groupWrap);
      continue;
    }

    const { buckets, folders } = buildFolderMap(rootName, files);
    for (const folder of folders) {
      const folderKey = `${rootName}:${folder}`;
      if (!(folderKey in state.folderOpen)) {
        state.folderOpen[folderKey] = true;
      }

      const folderWrap = document.createElement("section");
      folderWrap.className = "tree-folder";

      const folderHeader = document.createElement("button");
      folderHeader.type = "button";
      folderHeader.className = "tree-folder-header";
      folderHeader.setAttribute("aria-expanded", String(state.folderOpen[folderKey]));

      const folderTitle = document.createElement("span");
      folderTitle.textContent = `${state.folderOpen[folderKey] ? "v" : ">"} ${folder === "." ? "(root)" : folder}`;
      const folderCount = document.createElement("span");
      const folderFiles = buckets.get(folder) ?? [];
      folderCount.textContent = `${folderFiles.length}`;
      folderHeader.appendChild(folderTitle);
      folderHeader.appendChild(folderCount);
      folderHeader.addEventListener("click", () => {
        state.folderOpen[folderKey] = !state.folderOpen[folderKey];
        renderFileTree();
      });

      folderWrap.appendChild(folderHeader);

      if (state.folderOpen[folderKey]) {
        const fileList = document.createElement("div");
        fileList.className = "tree-files";

        for (const file of folderFiles) {
          const relative = file.path.slice(rootName.length + 1);
          const fileName = relative.split("/").pop() ?? relative;
          const directory = relative.includes("/")
            ? relative.slice(0, relative.lastIndexOf("/"))
            : "root";

          const button = document.createElement("button");
          button.type = "button";
          button.className = `file-btn${state.currentPath === file.path ? " active" : ""}`;
          button.title = `${file.path} (double-click to copy path)`;

          const nameWrap = document.createElement("span");
          nameWrap.className = "file-btn-main";

          const nameSpan = document.createElement("span");
          nameSpan.className = "file-btn-name";
          nameSpan.textContent = file.metadata?.title || fileName;
          const pathSpan = document.createElement("span");
          pathSpan.className = "file-btn-path";
          pathSpan.textContent = `${directory} | ${fileName}`;
          nameWrap.appendChild(nameSpan);
          nameWrap.appendChild(pathSpan);

          const dateSpan = document.createElement("span");
          dateSpan.className = "file-btn-date";
          dateSpan.textContent = formatDateTime(file.modifiedAt);

          button.appendChild(nameWrap);
          button.appendChild(dateSpan);

          button.addEventListener("click", () => void openDoc(file.path, true));
          button.addEventListener("dblclick", () => void copyText(file.path, null, "Path copied"));
          fileList.appendChild(button);
        }

        folderWrap.appendChild(fileList);
      }

      groupWrap.appendChild(folderWrap);
    }

    fileTreeEl.appendChild(groupWrap);
  }

  if (!hasAny) {
    const empty = document.createElement("p");
    empty.textContent = "No markdown files match current filters.";
    empty.style.margin = "0";
    empty.style.color = "var(--text-soft)";
    empty.style.fontSize = "13px";
    fileTreeEl.appendChild(empty);
  }

  renderTags();
  renderInsights();
  renderHomeDashboard();
  runPluginHook("onFileTreeRendered", {
    files: filtered,
    scope: state.scope,
    filter: state.filter,
    tagFilter: state.tagFilter
  });
}

function attachCodeBlockToolbars() {
  const blocks = docContentEl.querySelectorAll("pre > code");
  for (const code of blocks) {
    const pre = code.parentElement;
    if (!pre || pre.parentElement?.classList.contains("code-wrap")) {
      continue;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "code-wrap";

    const toolbar = document.createElement("div");
    toolbar.className = "code-toolbar";

    const langBadge = document.createElement("span");
    langBadge.className = "code-lang";
    const langClass = Array.from(code.classList).find((name) => name.startsWith("language-"));
    langBadge.textContent = langClass ? langClass.replace("language-", "") : "text";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-btn";
    button.textContent = "Copy";
    button.addEventListener("click", () =>
      void copyText(code.textContent ?? "", button, "Code copied")
    );

    toolbar.appendChild(langBadge);
    toolbar.appendChild(button);
    pre.replaceWith(wrapper);
    wrapper.appendChild(toolbar);
    wrapper.appendChild(pre);
  }
}

function wrapMarkdownTables() {
  const tables = docContentEl.querySelectorAll("table");
  for (const table of tables) {
    if (table.parentElement?.classList.contains("table-wrap")) {
      continue;
    }
    const wrapper = document.createElement("div");
    wrapper.className = "table-wrap";
    table.replaceWith(wrapper);
    wrapper.appendChild(table);
  }
}

function rewriteMarkdownLinks() {
  for (const image of docContentEl.querySelectorAll("img[src]")) {
    const src = image.getAttribute("src");
    if (isLocalNavigableHref(src)) {
      image.src = new URL(src, new URL(`/${state.currentPath}`, window.location.origin)).href;
    }
  }
  const links = docContentEl.querySelectorAll("a[href]");
  for (const link of links) {
    const href = link.getAttribute("href") ?? "";
    const resolvedMarkdownPath = resolveMarkdownLink(state.currentPath, href);
    if (resolvedMarkdownPath) {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        void openDoc(resolvedMarkdownPath, true);
      });
      continue;
    }

    const localUrl = isLocalNavigableHref(href)
      ? new URL(href, new URL(`/${state.currentPath}`, window.location.origin))
      : null;
    if (localUrl?.pathname.startsWith("/docs/") && !localUrl.pathname.endsWith(".md")) {
      link.href = localUrl.href;
      continue;
    }

    if (!isEditorLinkCandidate(href)) {
      continue;
    }

    const editorLinkUrl = buildEditorLinkUrl(state.currentPath, href, true);
    link.dataset.editorLink = "true";
    link.title = link.title ? `${link.title} | Open in VS Code` : "Open in VS Code";
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.assign(editorLinkUrl);
    });
  }
}

function updateDocHeader(path, modifiedAt, tags = [], metadata = null) {
  docTitleEl.textContent = metadata?.title ? metadata.title : path;
  const root = path.startsWith("docs/") ? "docs" : path.startsWith("agents/") ? "agents" : "";
  const segments = path.split("/");
  const fileName = segments[segments.length - 1] || path;
  const titleLabel = metadata?.title ? metadata.title : fileName;
  docSubtitleEl.textContent = `${path} | ${root || "markdown"}`;
  const normalizedTags = Array.isArray(tags)
    ? tags.map((tag) => normalizeTag(String(tag))).filter(Boolean)
    : [];
  const tagsLabel = normalizedTags.length
    ? normalizedTags.map((tag) => `#${tag}`).join(", ")
    : "none";
  const reviewLabel = metadata?.lastReviewed ? formatDateTime(metadata.lastReviewed) : "Unknown";
  docMetaEl.textContent = `Last updated: ${formatDateTime(modifiedAt)} | Last reviewed: ${reviewLabel} | Tags: ${tagsLabel}`;
  renderDocMetaCards(metadata);
  updateFeedbackLink(path, titleLabel);
}

async function openDoc(path, writeHash) {
  const response = await fetch(`/api/doc?path=${encodeURIComponent(path)}`);
  if (!response.ok) {
    const message = await response.text();
    docTitleEl.textContent = "Failed to open markdown file";
    docSubtitleEl.textContent = "API request failed";
    docMetaEl.textContent = "No metadata available";
    renderDocMetaCards(null);
    docContentEl.textContent = message;
    setDocSearchVisibility(false);
    resetDocSearchState();
    showToast("Unable to load document", "error");
    return;
  }

  const payload = await response.json();
  state.currentPath = payload.path;
  state.currentModifiedAt = typeof payload.modifiedAt === "string" ? payload.modifiedAt : "";
  state.currentMetadata = payload.metadata && typeof payload.metadata === "object"
    ? payload.metadata
    : null;
  state.currentTags = Array.isArray(payload.tags)
    ? [...new Set(payload.tags.map((tag) => normalizeTag(String(tag))).filter(Boolean))]
    : [];
  updateDocHeader(payload.path, state.currentModifiedAt, state.currentTags, state.currentMetadata);
  updateContentHeaderScrollState();
  rawLinkEl.href = `/api/doc/raw?path=${encodeURIComponent(payload.path)}`;
  setDocSearchVisibility(true);
  resetDocSearchState({ clearHighlights: false });

  docContentEl.innerHTML = parseMarkdown(payload.content);
  attachCodeBlockToolbars();
  wrapMarkdownTables();
  rewriteMarkdownLinks();
  setButtonDisabledState();
  addRecent(payload.path);
  renderFileTree();
  updateMobileTabbarState();
  runPluginHook("onDocumentLoaded", {
    path: payload.path,
    metadata: state.currentMetadata,
    tags: state.currentTags,
    modifiedAt: state.currentModifiedAt
  });

  if (writeHash) {
    window.location.hash = encodeURIComponent(payload.path);
  }

  if (isMobileLayout()) {
    setSidebarOpen(false);
  }
}

function clearRecent() {
  state.recent = [];
  saveRecent();
  renderRecent();
}

function setupDailyNotesInputs() {
  if (yesterdayNotesInputEl) yesterdayNotesInputEl.value = state.dailyNotes.yesterday;
  if (tomorrowNotesInputEl) tomorrowNotesInputEl.value = state.dailyNotes.tomorrow;
  if (futureNotesInputEl) futureNotesInputEl.value = state.dailyNotes.future;

  const bindings = [
    { key: "yesterday", el: yesterdayNotesInputEl },
    { key: "tomorrow", el: tomorrowNotesInputEl },
    { key: "future", el: futureNotesInputEl }
  ];

  for (const item of bindings) {
    if (!item.el) continue;
    item.el.addEventListener("input", (event) => {
      state.dailyNotes[item.key] = String(event.target.value ?? "");
      saveDailyNotes();
    });
  }
}

function setupDailyTaskInputs() {
  for (const [key, control] of Object.entries(dashboardTaskControls)) {
    if (control.addBtnEl) {
      control.addBtnEl.addEventListener("click", () => {
        addDashboardTask(key);
      });
    }
    if (control.inputEl) {
      control.inputEl.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        addDashboardTask(key);
      });
    }
  }
  setupDashboardTaskDropZones();
  renderAllDashboardTaskLists();
}

function setupPersonalityChecklistEvents() {
  if (!seedTomorrowFromChecklistBtnEl) return;
  seedTomorrowFromChecklistBtnEl.addEventListener("click", () => {
    addUncheckedPersonalityItemsToTomorrow();
  });
}

function initEvents() {
  scopeSelectEl.value = state.scope;
  sortSelectEl.value = state.sort;
  setupDailyNotesInputs();
  setupDailyTaskInputs();
  setupPersonalityChecklistEvents();
  if (tagFilterInputEl) {
    tagFilterInputEl.value = state.tagFilter;
  }
  updateDocSearchUi();

  filterInputEl.addEventListener("input", (event) => {
    state.filter = String(event.target.value ?? "");
    renderFileTree();
  });

  filterInputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const first = getFilteredFiles()[0];
      if (first) void openDoc(first.path, true);
    }
  });

  clearFilterBtnEl.addEventListener("click", () => {
    state.filter = "";
    filterInputEl.value = "";
    renderFileTree();
    filterInputEl.focus();
  });

  tagFilterInputEl.addEventListener("input", (event) => {
    state.tagFilter = String(event.target.value ?? "");
    renderFileTree();
  });

  tagFilterInputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const first = getFilteredFiles()[0];
      if (first) void openDoc(first.path, true);
    }
  });

  clearTagFilterBtnEl.addEventListener("click", () => {
    state.tagFilter = "";
    state.selectedTags = [];
    tagFilterInputEl.value = "";
    renderFileTree();
    tagFilterInputEl.focus();
  });

  if (docSearchInputEl) {
    docSearchInputEl.addEventListener("input", (event) => {
      highlightDocSearch(String(event.target.value ?? ""), { scrollToFirst: false });
    });

    docSearchInputEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const delta = event.shiftKey ? -1 : 1;
        setActiveDocSearchMatch(state.docSearchActiveIndex + delta);
      } else if (event.key === "Escape" && state.docSearchQuery) {
        event.preventDefault();
        resetDocSearchState();
      }
    });
  }

  if (docSearchPrevBtnEl) {
    docSearchPrevBtnEl.addEventListener("click", () => {
      setActiveDocSearchMatch(state.docSearchActiveIndex - 1);
    });
  }

  if (docSearchNextBtnEl) {
    docSearchNextBtnEl.addEventListener("click", () => {
      setActiveDocSearchMatch(state.docSearchActiveIndex + 1);
    });
  }

  if (docSearchClearBtnEl) {
    docSearchClearBtnEl.addEventListener("click", () => {
      resetDocSearchState();
      docSearchInputEl?.focus();
    });
  }

  scopeSelectEl.addEventListener("change", (event) => {
    state.scope = String(event.target.value ?? "all");
    renderFileTree();
  });

  sortSelectEl.addEventListener("change", (event) => {
    state.sort = String(event.target.value ?? "date-desc");
    renderFileTree();
  });

  expandGroupsBtnEl.addEventListener("click", () => {
    state.groupOpen.docs = true;
    state.groupOpen.agents = true;
    for (const key of Object.keys(state.folderOpen)) {
      state.folderOpen[key] = true;
    }
    renderFileTree();
  });

  collapseGroupsBtnEl.addEventListener("click", () => {
    state.groupOpen.docs = false;
    state.groupOpen.agents = false;
    for (const key of Object.keys(state.folderOpen)) {
      state.folderOpen[key] = false;
    }
    renderFileTree();
  });

  sidebarToggleBtnEl.addEventListener("click", () => {
    setSidebarOpen(!state.sidebarOpen);
  });

  if (desktopSidebarToggleBtnEl) {
    desktopSidebarToggleBtnEl.addEventListener("click", () => {
      toggleDesktopSidebar();
    });
  }

  mobileBackdropEl.addEventListener("click", () => {
    setSidebarOpen(false);
  });

  tabMenuBtnEl.addEventListener("click", () => {
    setSidebarOpen(!state.sidebarOpen);
  });

  tabDocsBtnEl.addEventListener("click", () => {
    const docsHome = hasFilePath("docs/README.md")
      ? "docs/README.md"
      : state.files.find((file) => file.path.startsWith("docs/"))?.path ?? "";
    if (docsHome) {
      void openDoc(docsHome, true);
    }
  });

  tabAgentsBtnEl.addEventListener("click", () => {
    const agentsHome = hasFilePath("agents/README.md")
      ? "agents/README.md"
      : state.files.find((file) => file.path.startsWith("agents/"))?.path ?? "";
    if (agentsHome) {
      void openDoc(agentsHome, true);
    }
  });

  tabTopBtnEl.addEventListener("click", () => {
    tabTopBtnEl.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("Scrolled to top", "info");
    setTimeout(() => {
      tabTopBtnEl.classList.remove("active");
    }, 500);
  });

  desktopTopBtnEl.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("Scrolled to top", "info");
  });

  copyPathBtnEl.addEventListener("click", () => {
    if (!state.currentPath) return;
    void copyText(state.currentPath, copyPathBtnEl, "Document path copied");
  });

  copyLinkBtnEl.addEventListener("click", () => {
    if (!state.currentPath) return;
    const url = `${window.location.origin}${window.location.pathname}#${encodeURIComponent(state.currentPath)}`;
    void copyText(url, copyLinkBtnEl, "Deep link copied");
  });

  themeSelectEl.addEventListener("change", (event) => {
    state.themePreference = String(event.target.value ?? "system");
    saveThemePreference();
    applyTheme();
  });

  const handleSystemThemeChange = () => {
    if (state.themePreference === "system") {
      applyTheme();
    }
  };
  if (typeof systemThemeMedia.addEventListener === "function") {
    systemThemeMedia.addEventListener("change", handleSystemThemeChange);
  } else if (typeof systemThemeMedia.addListener === "function") {
    systemThemeMedia.addListener(handleSystemThemeChange);
  }

  clearRecentBtnEl.addEventListener("click", clearRecent);

  window.addEventListener("resize", syncLayout);
  window.addEventListener("scroll", () => {
    updateDesktopTopButton();
    updateContentHeaderScrollState();
  }, { passive: true });

  window.addEventListener("hashchange", () => {
    const fromHash = getHashPath();
    if (!fromHash || fromHash === state.currentPath || !hasFilePath(fromHash)) {
      return;
    }
    void openDoc(fromHash, false);
  });

  window.addEventListener("keydown", (event) => {
    const target = event.target;
    const isInputTarget =
      target instanceof HTMLElement &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable);
    const key = String(event.key ?? "").toLowerCase();

    if ((event.ctrlKey || event.metaKey) && key === "f") {
      if (!state.currentPath || !docSearchInputEl || docSearchSectionEl?.classList.contains("hidden")) {
        return;
      }
      event.preventDefault();
      docSearchInputEl.focus();
      docSearchInputEl.select();
      return;
    }

    if (!isInputTarget && event.key === "/") {
      event.preventDefault();
      filterInputEl.focus();
      return;
    }

    if (event.key === "Escape") {
      if (isMobileLayout() && state.sidebarOpen) {
        setSidebarOpen(false);
      } else if (docSearchInputEl === document.activeElement && state.docSearchQuery) {
        resetDocSearchState();
      } else if (filterInputEl === document.activeElement && state.filter) {
        state.filter = "";
        filterInputEl.value = "";
        renderFileTree();
      } else if (tagFilterInputEl === document.activeElement && (state.tagFilter || state.selectedTags.length)) {
        state.tagFilter = "";
        state.selectedTags = [];
        tagFilterInputEl.value = "";
        renderFileTree();
      }
    }
  });

  window.addEventListener("beforeunload", () => {
    if (statusTimer) {
      clearInterval(statusTimer);
      statusTimer = null;
    }
    toastManager.clear();
  });
}

async function bootstrap() {
  state.recent = loadRecent();
  state.dailyNotes = loadDailyNotes();
  state.dailyTasks = loadDailyTasks();
  state.desktopSidebarCollapsed = loadDesktopSidebarPreference();
  state.personalityChecklist = loadPersonalityChecklist();
  loadTheme();
  initEvents();
  setButtonDisabledState();
  renderRecent();
  syncLayout();
  updateMobileTabbarState();
  updateDesktopTopButton();
  updateFeedbackLink("docs/README.md", "Backend Docs Index");
  if (pluginManager.count > 0) {
    showToast(`Loaded ${pluginManager.count} docs-viewer plugin(s)`, "info");
  }

  setStatusBadge(viewerStatusBadgeEl, "checking", "Docs: checking", "Checking docs-viewer status");
  setStatusBadge(backendStatusBadgeEl, "checking", "Backend: checking", "Checking backend health");
  await refreshViewerStatus();
  statusTimer = setInterval(() => {
    void refreshViewerStatus();
  }, 12000);

  const response = await fetch("/api/tree");
  if (!response.ok) {
    docTitleEl.textContent = "Failed to load markdown file list";
    docSubtitleEl.textContent = "API request failed";
    docMetaEl.textContent = "No metadata available";
    docContentEl.textContent = await response.text();
    setDocSearchVisibility(false);
    resetDocSearchState();
    return;
  }

  const payload = await response.json();
  if (typeof payload.config?.feedbackUrl === "string" && payload.config.feedbackUrl.trim()) {
    state.feedbackUrl = payload.config.feedbackUrl.trim();
  }
  if (typeof payload.config?.reviewStaleDays === "number" && payload.config.reviewStaleDays > 0) {
    state.reviewStaleDays = payload.config.reviewStaleDays;
  }
  const mappedFiles = Array.isArray(payload.files) ? payload.files.map(toFileRecord) : [];
  state.files = mappedFiles.filter((item) => Boolean(item));
  runPluginHook("onViewerReady", {
    fileCount: state.files.length,
    reviewStaleDays: state.reviewStaleDays
  });

  const fromHash = getHashPath();
  const preferred = fromHash && hasFilePath(fromHash) ? fromHash : "docs/README.md";
  const initial = hasFilePath(preferred) ? preferred : state.files[0]?.path ?? "";

  renderFileTree();
  if (initial) {
    await openDoc(initial, !fromHash);
  } else {
    docTitleEl.textContent = "No markdown files found";
    docSubtitleEl.textContent = "Expected files under docs/ or agents/";
    docMetaEl.textContent = "No metadata available";
    renderDocMetaCards(null);
    docContentEl.textContent = "Place markdown files under docs/ or agents/.";
    setDocSearchVisibility(false);
    resetDocSearchState();
    updateMobileTabbarState();
  }
}

void bootstrap();
