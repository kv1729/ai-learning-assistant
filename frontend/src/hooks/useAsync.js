import { useCallback, useEffect, useEffectEvent, useState } from "react";

// Loads data for `key` and re-runs when the key changes or reload() is called.
// While reloading the same key, the previous data stays visible (no flicker);
// `refreshing` is true until the new result arrives. When the key changes,
// `previousData` still holds the last result so a screen can keep stable
// chrome (e.g. tabs) on screen while the new data loads.
export function useAsync(load, key) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState({ key: null, version: -1, status: "loading", data: undefined, error: null });
  const run = useEffectEvent(load);

  useEffect(() => {
    let active = true;
    run().then(
      (data) => active && setResult({ key, version, status: "success", data, error: null }),
      (error) => active && setResult({ key, version, status: "error", data: undefined, error }),
    );
    return () => {
      active = false;
    };
  }, [key, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const current = result.key === key;

  return {
    status: current ? result.status : "loading",
    data: current ? result.data : undefined,
    error: current ? result.error : null,
    previousData: result.data,
    refreshing: current && result.version !== version,
    reload,
  };
}
