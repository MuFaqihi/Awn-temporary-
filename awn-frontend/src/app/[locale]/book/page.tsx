import type { Locale } from "@/lib/i18n";
import BookSession from "@/components/booking/book-session"; // <-- direct import (client component)

export default function BookPage({
  params,
}: {
  params: { locale: Locale };
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <BookSession locale={params.locale} />
    </div>
  );
}