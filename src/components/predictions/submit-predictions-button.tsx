"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/**
 * Disables itself the instant the form starts submitting (via
 * useFormStatus's pending state, driven by React itself — not a network
 * round trip), so rapid double/triple-clicking can't fire the Server Action
 * more than once.
 */
export function SubmitPredictionsButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-fit" disabled={pending}>
      {pending ? "Saving..." : "Save predictions"}
    </Button>
  );
}
