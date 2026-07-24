import { getQuotes } from "@/server/quotes/queries";
import { deleteQuote } from "@/server/quotes/mutations";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { QuoteUploadForm } from "@/components/admin/quote-upload-form";

export default async function QuotesAdminPage() {
  const quotes = await getQuotes();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Quotes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Screenshots from the Discord server — shown as a rotating
          background on the prediction form.
        </p>
      </div>

      <Card className="max-w-md">
        <CardContent>
          <QuoteUploadForm />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {quotes.length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground">
            No quotes yet.
          </p>
        )}
        {quotes.map((quote) => (
          <Card key={quote.id}>
            {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL */}
            <img
              src={quote.imageUrl}
              alt=""
              className="h-56 w-full bg-muted object-contain"
            />
            <CardContent>
              <form action={deleteQuote.bind(null, quote.id)}>
                <ConfirmSubmitButton
                  type="submit"
                  variant="destructive"
                  className="w-full"
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
