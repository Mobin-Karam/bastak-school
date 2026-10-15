const STORAGE = { recent: "moshaver.docs.recent.v2", theme: "moshaver.docs.theme.v2" };
const LABELS = { architecture: "Architecture", engineering: "Engineering", components: "Applications & API", features: "Features", "change-notes": "Change notes", operations: "Operations", product: "Product", platform: "Platform", transitions: "Transitions", evidence: "Evidence", reference: "Reference", archive: "Archive", releases: "Releases", security: "Security" };
const state = { files: [], path: "", query: "", recent: loadRecent(), theme: localStorage.getItem(STORAGE.theme) || "light" };
const $ = (id) => document.getElementById(id);
const el = { library: $("library"), backdrop: $("backdrop"), menu: $("menuButton"), search: $("globalSearch"), summary: $("searchSummary"), nav: $("libraryNav"), content: $("docContent"), crumbs: $("breadcrumbs"), outline: $("outline"), outlineNav: $("outlineNav"), pager: $("pager"), recentSection: $("recentSection"), recent: $("recentList"), clearRecent: $("clearRecent"), count: $("docCount"), theme: $("themeToggle"), copy: $("copyLink"), raw: $("rawDocument"), progress: $("readingProgress") };

function loadRecent() { try { const items = JSON.parse(localStorage.getItem(STORAGE.recent) || "[]"); return Array.isArray(items) ? items.slice(0, 8) : []; } catch { return []; } }
function saveRecent() { localStorage.setItem(STORAGE.recent, JSON.stringify(state.recent)); }
function title(file) { return file.metadata?.title || file.path.split("/").pop().replace(/\.md$/i, "").replace(/[-_]/g, " "); }
function category(file) { return file.path.split("/")[1] || "other"; }
function html(value) { const node = document.createElement("span"); node.textContent = value; return node.innerHTML; }
function applyTheme() { document.documentElement.dataset.theme = state.theme; el.theme.textContent = state.theme === "dark" ? "Light theme" : "Dark theme"; }
function setLibrary(open) { document.body.classList.toggle("library-open", open); el.menu.setAttribute("aria-expanded", String(open)); el.backdrop.hidden = !open; }
function currentHash() { return decodeURIComponent(location.hash.slice(1)) || "docs/README.md"; }
function score(file, query) { const q = query.toLowerCase(); return (title(file).toLowerCase().includes(q) ? 30 : 0) + (file.path.toLowerCase().includes(q) ? 12 : 0) + (String(file.searchText || "").toLowerCase().includes(q) ? 4 : 0); }
function shownFiles() { const query = state.query.trim(); return query ? state.files.filter((file) => score(file, query) > 0).sort((a, b) => score(b, query) - score(a, query) || title(a).localeCompare(title(b))) : state.files; }

function renderNav() {
  const files = shownFiles(), groups = new Map();
  files.forEach((file) => { const key = category(file); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(file); });
  el.nav.innerHTML = "";
  el.summary.textContent = state.query ? files.length + " result" + (files.length === 1 ? "" : "s") + " for “" + state.query + "”" : "Browse by subject";
  if (!files.length) { el.nav.innerHTML = '<p class="no-results">No documents match. Try another term.</p>'; return; }
  [...groups].sort(([a], [b]) => (LABELS[a] || a).localeCompare(LABELS[b] || b)).forEach(([key, items]) => {
    const section = document.createElement("section"), heading = document.createElement("h2"), list = document.createElement("div");
    section.className = "nav-group"; heading.textContent = (LABELS[key] || key) + " · " + items.length; list.className = "nav-list";
    items.sort((a, b) => title(a).localeCompare(title(b))).forEach((file) => {
      const link = document.createElement("a"); link.href = "#" + encodeURIComponent(file.path); link.className = file.path === state.path ? "active" : "";
      link.innerHTML = "<strong>" + html(title(file)) + "</strong><span>" + html(file.path.replace(/^docs\//, "").replace(/\/README\.md$/i, "")) + "</span>"; list.appendChild(link);
    });
    section.append(heading, list); el.nav.appendChild(section);
  });
}
function renderRecent() {
  const files = state.recent.map((path) => state.files.find((file) => file.path === path)).filter(Boolean);
  el.recent.innerHTML = ""; el.recentSection.classList.toggle("hidden", !files.length);
  files.forEach((file) => { const link = document.createElement("a"); link.href = "#" + encodeURIComponent(file.path); link.textContent = title(file); el.recent.appendChild(link); });
}
function slug(value) { return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-"); }
function renderOutline() {
  const headings = [...el.content.querySelectorAll("h2, h3")], seen = new Map(); el.outlineNav.innerHTML = ""; el.outline.classList.toggle("hidden", !headings.length);
  headings.forEach((heading) => { const base = slug(heading.textContent) || "section", n = seen.get(base) || 0, id = base + "-" + n; seen.set(base, n + 1); heading.id = id; const link = document.createElement("a"); link.href = "#" + encodeURIComponent(state.path) + ":" + id; link.textContent = heading.textContent; if (heading.tagName === "H3") link.className = "depth-3"; link.onclick = (event) => { event.preventDefault(); heading.scrollIntoView({ behavior: "smooth", block: "start" }); }; el.outlineNav.appendChild(link); });
}
function renderPager() {
  const siblings = state.files.filter((file) => category(file) === category({ path: state.path })).sort((a, b) => title(a).localeCompare(title(b))), index = siblings.findIndex((file) => file.path === state.path);
  el.pager.innerHTML = ""; el.pager.classList.toggle("hidden", index < 0);
  [[siblings[index - 1], "Previous"], [siblings[index + 1], "Next"]].forEach(([file, label]) => { if (!file) return; const link = document.createElement("a"); link.href = "#" + encodeURIComponent(file.path); link.innerHTML = "<small>" + label + "</small><strong>" + html(title(file)) + "</strong>"; el.pager.appendChild(link); });
}
function enhanceLinks() {
  el.content.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (/^(https?:|mailto:|#)/i.test(href)) { if (/^https?:/i.test(href)) { link.target = "_blank"; link.rel = "noreferrer"; } return; }
    const target = href.split("#")[0].split("?")[0];
    const fragment = href.includes("#") ? href.slice(href.indexOf("#") + 1) : "";
    if (!target.endsWith(".md")) return;
    link.onclick = (event) => { const base = state.path.slice(0, state.path.lastIndexOf("/") + 1), path = target.startsWith("/") ? target.slice(1) : new URL(target, "https://docs.local/" + base).pathname.slice(1); event.preventDefault(); location.hash = encodeURIComponent(path) + (fragment ? ":" + fragment : ""); };
  });
}
async function open(pathWithAnchor) {
  const [path, anchor] = pathWithAnchor.split(":");
  if (!state.files.some((file) => file.path === path)) { el.content.innerHTML = '<div class="empty-state"><h1>Document not found</h1><p>Choose a document from the library.</p></div>'; return; }
  el.content.innerHTML = '<p class="loading">Loading document…</p>';
  try {
    const response = await fetch("/api/doc?path=" + encodeURIComponent(path)); if (!response.ok) throw new Error("Document could not be loaded");
    const doc = await response.json(); state.path = doc.path; document.title = (doc.metadata?.title || title({ path })) + " · Moshaver Docs";
    el.content.innerHTML = window.marked.parse(doc.content); enhanceLinks(); el.crumbs.textContent = path.replace(/^docs\//, "").replace(/\/README\.md$/, ""); renderOutline(); renderPager();
    el.raw.href = "/api/doc/raw?path=" + encodeURIComponent(path); el.raw.removeAttribute("aria-disabled"); el.copy.disabled = false;
    state.recent = [path, ...state.recent.filter((item) => item !== path)].slice(0, 8); saveRecent(); renderRecent(); renderNav();
    if (anchor) requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView()); else window.scrollTo({ top: 0, behavior: "instant" });
  } catch (error) { el.content.innerHTML = '<div class="empty-state"><h1>Could not load this document</h1><p>' + html(error.message) + "</p></div>"; }
}
function progress() { const max = document.documentElement.scrollHeight - window.innerHeight; el.progress.style.width = (max > 0 ? Math.min(100, window.scrollY / max * 100) : 0) + "%"; }
async function init() { applyTheme(); const response = await fetch("/api/tree"); if (!response.ok) throw new Error("Documentation library is unavailable"); const data = await response.json(); state.files = data.files.filter((file) => file.path.startsWith("docs/")); el.count.textContent = state.files.length + " documents"; renderNav(); renderRecent(); await open(currentHash()); }

el.search.oninput = () => { state.query = el.search.value; renderNav(); };
el.menu.onclick = () => setLibrary(!document.body.classList.contains("library-open"));
el.backdrop.onclick = () => setLibrary(false);
el.clearRecent.onclick = () => { state.recent = []; saveRecent(); renderRecent(); };
el.theme.onclick = () => { state.theme = state.theme === "dark" ? "light" : "dark"; localStorage.setItem(STORAGE.theme, state.theme); applyTheme(); };
el.copy.onclick = async () => { await navigator.clipboard.writeText(location.href); el.copy.textContent = "Copied"; setTimeout(() => { el.copy.textContent = "Copy link"; }, 1000); };
window.onhashchange = () => { setLibrary(false); void open(currentHash()); };
window.addEventListener("scroll", progress, { passive: true });
window.addEventListener("keydown", (event) => { if (event.key === "/" && document.activeElement?.tagName !== "INPUT") { event.preventDefault(); el.search.focus(); } if (event.key === "Escape") { el.search.value = ""; state.query = ""; renderNav(); setLibrary(false); } });
init().catch((error) => { el.content.innerHTML = '<div class="empty-state"><h1>Documentation unavailable</h1><p>' + html(error.message) + "</p></div>"; });
