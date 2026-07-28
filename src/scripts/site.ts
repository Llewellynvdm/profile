import { matchesCapability, matchesCommand } from "./filters.mjs";

document.documentElement.classList.add("js");

const root = document.documentElement;
const themeButton = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");

function resolvedTheme(): "light" | "dark" {
  const explicit = root.dataset.theme;
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function updateThemeLabel() {
  if (!themeButton) return;
  const next = resolvedTheme() === "dark" ? "light" : "dark";
  themeButton.setAttribute("aria-label", `Switch to ${next} colour theme`);
}

themeButton?.addEventListener("click", () => {
  const next = resolvedTheme() === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try {
    localStorage.setItem("lvdm-theme", next);
  } catch {
    // Theme persistence is optional.
  }
  updateThemeLabel();
});
updateThemeLabel();

const header = document.querySelector<HTMLElement>("[data-header]");
const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 8);
updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const menuButton = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
const mobileNav = document.querySelector<HTMLElement>("[data-mobile-nav]");
menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
  mobileNav?.classList.toggle("is-open", open);
});
mobileNav?.addEventListener("click", (event) => {
  if (!(event.target instanceof HTMLAnchorElement)) return;
  menuButton?.setAttribute("aria-expanded", "false");
  menuButton?.setAttribute("aria-label", "Open navigation menu");
  mobileNav.classList.remove("is-open");
});

const capabilityButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-capability-filter]"),
);
const capabilityCards = Array.from(
  document.querySelectorAll<HTMLElement>("[data-capability-card]"),
);

for (const button of capabilityButtons) {
  button.addEventListener("click", () => {
    const selected = button.dataset.capabilityFilter ?? "all";
    for (const current of capabilityButtons) {
      const active = current === button;
      current.classList.toggle("is-active", active);
      current.setAttribute("aria-pressed", String(active));
    }
    for (const card of capabilityCards) {
      card.hidden = !matchesCapability(selected, card.dataset.group ?? "");
    }
  });
}

const dialog = document.querySelector<HTMLDialogElement>("#command-palette");
const commandInput = document.querySelector<HTMLInputElement>("#command-query");
const commandLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-command]"));
let selectedCommand = 0;

function visibleCommands() {
  return commandLinks.filter((link) => !link.hidden);
}

function selectCommand(index: number) {
  const links = visibleCommands();
  if (links.length === 0) return;
  selectedCommand = (index + links.length) % links.length;
  for (const link of commandLinks) link.classList.remove("is-selected");
  links[selectedCommand]?.classList.add("is-selected");
}

function openCommands() {
  if (!dialog) return;
  if (!dialog.open) dialog.showModal();
  commandInput?.focus();
  commandInput?.select();
  selectCommand(0);
}

for (const trigger of document.querySelectorAll<HTMLButtonElement>("[data-command-open]")) {
  trigger.addEventListener("click", openCommands);
}

document.addEventListener("keydown", (event) => {
  const target = event.target;
  const isTyping =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable);

  if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !isTyping)) {
    event.preventDefault();
    openCommands();
    return;
  }

  if (!dialog?.open) return;
  if (event.key === "ArrowDown") {
    event.preventDefault();
    selectCommand(selectedCommand + 1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    selectCommand(selectedCommand - 1);
  } else if (event.key === "Enter" && document.activeElement === commandInput) {
    const link = visibleCommands()[selectedCommand];
    if (link) {
      event.preventDefault();
      link.click();
    }
  }
});

commandInput?.addEventListener("input", () => {
  for (const link of commandLinks) {
    const searchable = `${link.textContent ?? ""} ${link.dataset.command ?? ""}`;
    link.hidden = !matchesCommand(commandInput.value, searchable);
  }
  selectedCommand = 0;
  selectCommand(0);
});

for (const link of commandLinks) {
  link.addEventListener("click", () => dialog?.close());
}

const revealItems = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.1 },
  );
  for (const item of revealItems) observer.observe(item);
} else {
  for (const item of revealItems) item.classList.add("is-visible");
}

document.querySelector<HTMLButtonElement>("[data-print]")?.addEventListener("click", () => {
  window.print();
});
