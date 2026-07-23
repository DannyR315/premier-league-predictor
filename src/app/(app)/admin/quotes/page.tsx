import { getQuotes } from "@/server/quotes/queries";
import { createQuote, deleteQuote } from "@/server/quotes/mutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";

export default async function QuotesAdminPage() {
  const quotes = await getQuotes();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Quotes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hot takes and statements from the Discord server — shown as a
          rotating background on the prediction form.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add quote</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createQuote} className="flex max-w-md flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="imageUrl">Screenshot URL</Label>
              <Input id="imageUrl" name="imageUrl" type="url" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="text">Caption (optional)</Label>
              <Textarea id="text" name="text" rows={2} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="authorName">Who said it (optional)</Label>
              <Input id="authorName" name="authorName" />
            </div>
            <Button type="submit">Add quote</Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {quotes.length === 0 && (
          <p className="text-sm text-muted-foreground">No quotes yet.</p>
        )}
        {quotes.map((quote) => (
          <Card key={quote.id}>
            <CardContent className="flex items-start justify-between gap-4 pt-6">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL */}
                <img
                  src={quote.imageUrl}
                  alt=""
                  className="h-16 w-16 rounded-md object-cover"
                />
                <div className="flex flex-col gap-1">
                  {quote.text && <p className="text-sm italic">&ldquo;{quote.text}&rdquo;</p>}
                  {quote.authorName && (
                    <p className="text-xs text-muted-foreground">
                      — {quote.authorName}
                    </p>
                  )}
                </div>
              </div>
              <form action={deleteQuote.bind(null, quote.id)}>
                <ConfirmSubmitButton
                  type="submit"
                  variant="destructive"
                  confirmMessage="Delete this quote?"
                >
                  Delete
                </ConfirmSubmitButton>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
