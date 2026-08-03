"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";

/** Phones, and small tablets held in portrait. */
export const MOBILE_BREAKPOINT = 768;

/**
 * Subscribes to a media query. The server has no viewport, so SSR renders the
 * desktop layout and React swaps in the real value on the first client render
 * — that keeps the markup identical on both sides instead of hydration-erroring.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onStoreChange);
      return () => list.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useIsMobile = () =>
  useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT}px)`);

type StyleSheet = Record<string, CSSProperties>;

/**
 * This app styles everything inline, and a media query cannot reach an inline
 * style. So each screen keeps a second, partial style sheet that gets merged
 * over the base one while the viewport is narrow.
 */
export function useResponsiveStyles<T extends StyleSheet>(
  base: T,
  mobile: Partial<Record<keyof T, CSSProperties>>,
): T {
  const isMobile = useIsMobile();

  return useMemo(() => {
    if (!isMobile) return base;
    const merged: StyleSheet = { ...base };
    for (const [key, overrides] of Object.entries(mobile)) {
      merged[key] = { ...base[key], ...overrides };
    }
    return merged as T;
  }, [base, mobile, isMobile]);
}
