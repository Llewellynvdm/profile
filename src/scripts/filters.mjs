export function normalizeSearch(value) {
  return value.trim().toLocaleLowerCase();
}

export function matchesCommand(searchValue, commandValue) {
  const query = normalizeSearch(searchValue);
  if (!query) return true;

  const terms = query.split(/\s+/).filter(Boolean);
  const haystack = normalizeSearch(commandValue);
  return terms.every((term) => haystack.includes(term));
}

export function matchesCapability(selectedGroup, cardGroup) {
  return selectedGroup === "all" || selectedGroup === cardGroup;
}
