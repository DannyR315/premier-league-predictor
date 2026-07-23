"use client";

import { createContext, useContext } from "react";

/**
 * Lets Combobox portal its popover inside a themed ancestor instead of
 * document.body, so scoped CSS variable overrides (like .predict-theme)
 * reach it. Defaults to null, which Combobox treats as "use the normal
 * document.body portal" — unaffected everywhere this isn't provided.
 */
export const PortalContainerContext = createContext<HTMLElement | null>(null);

export function usePortalContainer() {
  return useContext(PortalContainerContext);
}
