import type { FaqSection } from "@/lib/content/faq";

type FaqSectionsProps = {
  sections: FaqSection[];
};

export function FaqSections({ sections }: FaqSectionsProps) {
  const firstItemId = sections[0]?.items[0]?.id;

  return (
    <div className="flex flex-col gap-10">
      {sections.map((section) => (
        <section key={section.title} aria-labelledby={`faq-${section.title}`}>
          <h2
            id={`faq-${section.title}`}
            className="text-lg font-semibold text-ink"
          >
            {section.title}
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {section.items.map((item) => (
              <li key={item.id}>
                <details
                  open={item.id === firstItemId ? true : undefined}
                  className="group rounded-2xl border border-line bg-card open:border-brand-400/40 open:bg-brand-50/30 open:shadow-sm"
                >
                  <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-ink marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-start justify-between gap-3">
                      {item.question}
                      <span
                        className="mt-0.5 shrink-0 text-brand-700 transition group-open:rotate-180"
                        aria-hidden
                      >
                        ▾
                      </span>
                    </span>
                  </summary>
                  <p className="px-5 pb-4 text-sm leading-relaxed text-muted">{item.answer}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}