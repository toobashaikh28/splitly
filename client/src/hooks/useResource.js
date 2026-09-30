import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axios.js";
import { errorMessage } from "../utils/errors.js";

/**
 * Loads a GET endpoint and tracks loading / error state.
 *  - `loading` is true only until the first successful response, so
 *    refreshing after an action never flashes a skeleton.
 *  - `reload()` re-fetches; late responses from older requests are ignored.
 */
export default function useResource(url, fallbackError) {
  const [state, setState] = useState({ data: null, error: "", loading: true });
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setState((s) => ({ ...s, error: "", loading: s.data === null }));
    try {
      const res = await api.get(url);
      if (id === requestId.current) setState({ data: res.data, error: "", loading: false });
    } catch (err) {
      if (id === requestId.current) setState((s) => ({ ...s, loading: false, error: errorMessage(err, fallbackError) }));
    }
  }, [url, fallbackError]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
