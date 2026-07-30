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

export function matchesRepository(filters, repository) {
  const terms = normalizeSearch(filters.query).split(/\s+/).filter(Boolean);
  const haystack = normalizeSearch(repository.search);

  return (
    (filters.owner === "all" || filters.owner === repository.owner) &&
    (filters.tier === "all" || filters.tier === repository.tier) &&
    (filters.language === "all" || filters.language === repository.language) &&
    terms.every((term) => haystack.includes(term))
  );
}
