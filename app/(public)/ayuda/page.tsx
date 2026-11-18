import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { PageHeader } from "@/components/layout/page-header";
import { FaqSections } from "@/components/help/faq-sections";
import { Button } from "@/components/ui/button";
import { FAQ_SECTIONS } from "@/lib/content/faq";

export const metadata: Metadata = {
  title: "Ayuda",
  description:
    "Preguntas frecuentes sobre cómo usar canchaAbierta: cuenta, inscripción, pago y día del partido.",
};

export default function AyudaPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6">
      <Breadcrumb href="/" label="Inicio" />
      <PageHeader
        title="Ayuda"
        description="Ideas claras para quien llega por primera vez: cuándo hay partidos, si puedes ir solo, qué pagas y qué llevar."
      />

      <FaqSections sections={FAQ_SECTIONS} />

      <section
        aria-labelledby="ayuda-acciones"
        className="rounded-3xl border border-line bg-brand-50 p-6"
      >
        <h2 id="ayuda-acciones" className="text-base font-semibold">
          ¿Listo para jugar?
        </h2>
        <p className="mt-2 text-sm text-muted">
          Explora partidos abiertos o completa tu perfil antes de inscribirte.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/partidos">Ver partidos</Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/cuenta/perfil">Completar perfil</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}