"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { createQuote } from "@/server/quotes/mutations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function QuoteUploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Pick a screenshot to upload.");
      return;
    }

    setIsUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/quotes/upload",
      });

      const formData = new FormData(formRef.current!);
      formData.set("imageUrl", blob.url);

      await createQuote(formData);
      formRef.current?.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex max-w-md flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="image">Screenshot</Label>
        <Input
          id="image"
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="text">Caption (optional)</Label>
        <Textarea id="text" name="text" rows={2} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="authorName">Who said it (optional)</Label>
        <Input id="authorName" name="authorName" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isUploading}>
        {isUploading ? "Uploading..." : "Add quote"}
      </Button>
    </form>
  );
}
