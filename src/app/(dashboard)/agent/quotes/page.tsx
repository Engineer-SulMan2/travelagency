import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMyQuotes } from "@/lib/actions/quotes";
import { AddQuoteForm } from "@/components/quotes/add-quote-form";
import { QuotesList } from "@/components/quotes/quotes-list";

export default async function QuotesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const quotes = await getMyQuotes();

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Quotes</h1>
      <p className="mb-6 text-sm text-slate-500">
        Put together a price estimate and share it with a customer before they book.
      </p>

      <div className="mb-5">
        <AddQuoteForm />
      </div>

      <QuotesList quotes={quotes} />
    </div>
  );
}