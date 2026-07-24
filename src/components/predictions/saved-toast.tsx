"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function SavedToast() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const saved = searchParams.get("saved");

  useEffect(() => {
    if (saved !== "1") return;
    toast.success("Your predictions have been saved.");
    // Strip the query param so refreshing/back-navigating doesn't re-toast.
    router.replace("/seasons");
  }, [saved, router]);

  return null;
}
