/**
 * The query string of the page right now.
 * Filter updates start from this instead of the `searchParams` captured when the page
 * last rendered, so two quick filter clicks can never overwrite each other.
 */
export const currentSearchParams = () => new URLSearchParams(window.location.search);

/**
 * Applies filter changes to the current query string and returns the new params.
 * Empty values (and the given defaults) are removed to keep URLs short;
 * any change except a page change goes back to page 1.
 *
 *   setSearchParams(withChanges({ category: 'Gaming' }, { sort: 'newest' }))
 */
export const withChanges = (changes, defaults = {}) => {
  const next = currentSearchParams();
  Object.entries(changes).forEach(([key, value]) => {
    const isDefault = value === '' || value === null || value === undefined || value === false || value === defaults[key];
    if (isDefault || (key === 'page' && Number(value) === 1)) next.delete(key);
    else next.set(key, String(value));
  });
  if (!('page' in changes)) next.delete('page');
  return next;
};
