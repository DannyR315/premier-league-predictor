"use client";

import { useState } from "react";
import { PortalContainerContext } from "@/components/ui/portal-container-context";

/**
 * Captures its own DOM node as a portal container so descendant Comboboxes
 * (rendered anywhere below, including from Server Component parents) can
 * portal their popovers inside this themed subtree instead of document.body.
 */
export function ThemedFormPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  return (
    <div ref={setContainer} className={className}>
      <PortalContainerContext.Provider value={container}>
        {children}
      </PortalContainerContext.Provider>
    </div>
  );
}
