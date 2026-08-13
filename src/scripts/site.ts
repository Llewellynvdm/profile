import { matchesCapability, matchesCommand, matchesRepository } from "./filters.mjs";
import {
  describeThemePreference,
  normalizeThemePreference,
  resolveThemePreference,
  THEME_STORAGE_KEY,
} from "./theme.mjs";

document.documentElement.classList.add("js");

const root = document.documentElement;
const themeSelect = document.querySelector<HTMLSelectElement>("[data-theme-select]");
const themeStatus = document.querySelector<HTMLElement>("[data-theme-status]");
const themeColour = document.querySelector<HTMLMetaElement>("[data-theme-colour]");
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

function readThemePreference() {
  try {
    return normalizeThemePreference(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    // Theme persistence is optional.
    return "system";
  }
}

let themePreference = readThemePreference();

function applyThemePreference(preference: "system" | "light" | "dark", persist = false) {
  themePreference = normalizeThemePreference(preference);

  if (themePreference === "system") delete root.dataset.theme;
  else root.dataset.theme = themePreference;

  root.dataset.themePreference = themePreference;
  if (themeSelect) themeSelect.value = themePreference;

  const resolvedTheme = resolveThemePreference(themePreference, systemTheme.matches);
  if (themeStatus) {
    themeStatus.textContent = describeThemePreference(themePreference, resolvedTheme);
  }
  if (themeColour) {
    themeColour.content = resolvedTheme === "dark" ? "#0d1117" : "#f7f9fc";
  }

  if (!persist) return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themePreference);
  } catch {
    // The selected theme still applies for the current page view.
  }
}

themeSelect?.addEventListener("change", () => {
  applyThemePreference(normalizeThemePreference(themeSelect.value), true);
});

systemTheme.addEventListener("change", () => {
  if (themePreference === "system") applyThemePreference("system");
});

applyThemePreference(themePreference);

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

const repositoryForm = document.querySelector<HTMLFormElement>("[data-repository-filters]");
const repositoryQuery = document.querySelector<HTMLInputElement>("[data-repository-query]");
const repositoryOwner = document.querySelector<HTMLSelectElement>("[data-repository-owner]");
const repositoryTier = document.querySelector<HTMLSelectElement>("[data-repository-tier]");
const repositoryLanguage = document.querySelector<HTMLSelectElement>("[data-repository-language]");
const repositoryCards = Array.from(
  document.querySelectorAll<HTMLElement>("[data-repository-card]"),
);
const repositoryCount = document.querySelector<HTMLElement>("[data-repository-count]");
const repositoryEmpty = document.querySelector<HTMLElement>("[data-repository-empty]");

function applyRepositoryFilters(updateAddress = true) {
  if (
    !repositoryForm ||
    !repositoryQuery ||
    !repositoryOwner ||
    !repositoryTier ||
    !repositoryLanguage
  ) {
    return;
  }

  const filters = {
    query: repositoryQuery.value,
    owner: repositoryOwner.value,
    tier: repositoryTier.value,
    language: repositoryLanguage.value,
  };
  let visible = 0;

  for (const card of repositoryCards) {
    const matches = matchesRepository(filters, {
      search: card.dataset.search ?? "",
      owner: card.dataset.owner ?? "",
      tier: card.dataset.tier ?? "",
      language: card.dataset.language ?? "",
    });
    card.hidden = !matches;
    if (matches) visible += 1;
  }

  if (repositoryCount) repositoryCount.textContent = String(visible);
  if (repositoryEmpty) repositoryEmpty.hidden = visible !== 0;

  if (updateAddress) {
    const url = new URL(window.location.href);
    const values = [
      ["query", filters.query.trim()],
      ["owner", filters.owner],
      ["tier", filters.tier],
      ["language", filters.language],
    ];
    for (const [key, value] of values) {
      if (!value || value === "all") url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }
}

if (repositoryForm && repositoryQuery && repositoryOwner && repositoryTier && repositoryLanguage) {
  const initial = new URL(window.location.href).searchParams;
  const initialOwner = initial.get("owner");
  const initialTier = initial.get("tier");
  const initialLanguage = initial.get("language");

  repositoryQuery.value = initial.get("query") ?? "";
  if (
    initialOwner &&
    Array.from(repositoryOwner.options).some((option) => option.value === initialOwner)
  ) {
    repositoryOwner.value = initialOwner;
  }
  if (
    initialTier &&
    Array.from(repositoryTier.options).some((option) => option.value === initialTier)
  ) {
    repositoryTier.value = initialTier;
  }
  if (
    initialLanguage &&
    Array.from(repositoryLanguage.options).some((option) => option.value === initialLanguage)
  ) {
    repositoryLanguage.value = initialLanguage;
  }

  repositoryForm.addEventListener("input", () => applyRepositoryFilters());
  repositoryForm.addEventListener("change", () => applyRepositoryFilters());
  repositoryForm.addEventListener("reset", () => {
    window.setTimeout(() => applyRepositoryFilters(), 0);
  });
  applyRepositoryFilters(false);
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
