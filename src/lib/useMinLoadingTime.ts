import { useEffect, useRef, useState } from "react";

/** Keeps loading visible for at least `minMs` so entrance animations can finish. */
export function useMinLoadingTime(loading: boolean, minMs = 1800) {
  const [show, setShow] = useState(loading);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (loading) {
      startedAt.current = Date.now();
      setShow(true);
      return;
    }

    const remaining = Math.max(0, minMs - (Date.now() - startedAt.current));
    const timer = setTimeout(() => setShow(false), remaining);
    return () => clearTimeout(timer);
  }, [loading, minMs]);

  return show;
}
