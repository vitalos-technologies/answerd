import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"
import { ChevronDown } from "lucide-react"
import { Accordion, AccordionItem } from "@/components/ui/accordion"

/** A page's FAQs in the same accordion as the home page (components/site/faqs.tsx), with FAQPage JSON-LD left to the page. */
export function FaqList({ id, heading, items }: { id: string; heading: string; items: readonly { q: string; a: string }[] }) {
  return (
    <section aria-labelledby={id} className="mx-auto max-w-[760px]">
      <h2 id={id} className="t-section text-center">
        {heading}
      </h2>
      <Accordion className="mt-8 rounded-2xl border border-line bg-white px-5 shadow-card md:mt-10 md:px-8">
        {items.map((item) => (
          <AccordionItem key={item.q} className="border-line">
            <AccordionPrimitive.Header className="m-0">
              <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between gap-4 rounded-lg py-5 text-left text-base leading-6 font-semibold text-navy transition-colors hover:text-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue md:py-6 md:text-lg md:leading-7">
                {item.q}
                <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-sky text-navy transition-[transform,background-color,color] duration-200 group-hover:bg-blue-tint group-hover:text-blue group-data-panel-open:rotate-180 group-data-panel-open:bg-blue-tint group-data-panel-open:text-blue motion-reduce:transition-none">
                  <ChevronDown className="size-[18px]" strokeWidth={2.2} />
                </span>
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Panel className="h-(--accordion-panel-height) overflow-hidden transition-[height] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none">
              <p className="pr-12 pb-6 text-slate">{item.a}</p>
            </AccordionPrimitive.Panel>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}

/** FAQPage structured data for a list of questions. */
export const faqJsonLd = (items: readonly { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
})
