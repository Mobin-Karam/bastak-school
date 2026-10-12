function getToastMeta(type) {
  if (type === "error") return { icon: "X", label: "Error", tone: "error" };
  if (type === "success") return { icon: "OK", label: "Success", tone: "success" };
  if (type === "warning") return { icon: "!", label: "Warning", tone: "warning" };
  return { icon: "i", label: "Info", tone: "info" };
}

function removeToast(toastEl) {
  if (!toastEl || !toastEl.parentElement) return;
  toastEl.classList.remove("show");
  setTimeout(() => {
    toastEl.remove();
  }, 220);
}

export function createToastManager(containerEl, options = {}) {
  const durationMs = Number(options.durationMs) > 0 ? Number(options.durationMs) : 2800;
  const maxVisible = Number(options.maxVisible) > 0 ? Number(options.maxVisible) : 4;
  const timers = new Set();

  function show(message, type = "info") {
    if (!containerEl || !message) return;

    const meta = getToastMeta(type);
    const toastEl = document.createElement("article");
    toastEl.className = `toast toast-${meta.tone}`;
    toastEl.setAttribute("role", meta.tone === "error" ? "alert" : "status");

    const iconEl = document.createElement("span");
    iconEl.className = "toast-icon";
    iconEl.setAttribute("aria-hidden", "true");
    iconEl.textContent = meta.icon;

    const contentEl = document.createElement("div");
    contentEl.className = "toast-content";

    const titleEl = document.createElement("p");
    titleEl.className = "toast-title";
    titleEl.textContent = meta.label;

    const messageEl = document.createElement("p");
    messageEl.className = "toast-message";
    messageEl.textContent = String(message);

    const closeBtnEl = document.createElement("button");
    closeBtnEl.type = "button";
    closeBtnEl.className = "toast-close";
    closeBtnEl.setAttribute("aria-label", "Dismiss notification");
    closeBtnEl.textContent = "x";

    contentEl.appendChild(titleEl);
    contentEl.appendChild(messageEl);
    toastEl.appendChild(iconEl);
    toastEl.appendChild(contentEl);
    toastEl.appendChild(closeBtnEl);
    containerEl.appendChild(toastEl);

    if (containerEl.children.length > maxVisible) {
      const firstToast = containerEl.firstElementChild;
      if (firstToast && firstToast !== toastEl) {
        removeToast(firstToast);
      }
    }

    requestAnimationFrame(() => {
      toastEl.classList.add("show");
    });

    const timer = setTimeout(() => {
      timers.delete(timer);
      removeToast(toastEl);
    }, durationMs);
    timers.add(timer);

    closeBtnEl.addEventListener("click", () => {
      clearTimeout(timer);
      timers.delete(timer);
      removeToast(toastEl);
    });
  }

  function clear() {
    for (const timer of timers) {
      clearTimeout(timer);
    }
    timers.clear();
    if (!containerEl) return;
    containerEl.innerHTML = "";
  }

  return { show, clear };
}
