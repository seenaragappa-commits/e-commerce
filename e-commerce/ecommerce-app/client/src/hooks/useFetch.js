import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../utils/getErrorMessage';

/**
 * Loads data from the API and tracks loading / error state.
 * The request runs again whenever `key` changes, e.g.:
 *
 *   const { data, loading, error, reload } = useFetch(() => getProduct(id), `product:${id}`);
 *
 * While a new request is loading, `data` still holds the previous result
 * (so lists don't flash empty when a filter changes).
 */
export default function useFetch(request, key) {
  const [result, setResult] = useState({ key: null, data: null, error: '' });
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${key}#${attempt}`;

  useEffect(() => {
    let ignore = false; // ignore answers that arrive after the key has changed

    request()
      .then((data) => {
        if (!ignore) setResult({ key: requestKey, data, error: '' });
      })
      .catch((error) => {
        if (!ignore) setResult((previous) => ({ key: requestKey, data: previous.data, error: getErrorMessage(error) }));
      });

    return () => {
      ignore = true;
    };
    // `request` is a new function on every render; the request itself is identified by `requestKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const reload = useCallback(() => setAttempt((count) => count + 1), []);

  // Replace the data locally (e.g. with the updated order returned by the API).
  const setData = useCallback((data) => setResult((previous) => ({ ...previous, data })), []);

  const loading = result.key !== requestKey;

  return {
    data: result.data,
    loading,
    error: loading ? '' : result.error,
    reload,
    setData,
  };
}
