import { FiMapPin, FiPhone } from "react-icons/fi";

const MAP_URL = "https://maps.app.goo.gl/yxHQeZbnPVab2bqH6?g_st=ac";

function ContactPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
      <div className="max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-accent">
          Contact Us
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-brand sm:text-4xl">
          We&apos;re here to help.
        </h1>
        <p className="mt-5 text-lg leading-8 text-gray-600">
          Have a question about a product, order, delivery, return, or exchange?
          Get in touch with Sagar Sports and we&apos;ll be happy to help.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent">
            <FiPhone size={21} />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-brand">Call Us</h2>
          <p className="mt-2 text-gray-600">For product, order, return, and exchange enquiries.</p>
          <a
            href="tel:9255552245"
            className="mt-5 inline-flex items-center rounded-md bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent/90"
          >
            Call 9255552245
          </a>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent">
            <FiMapPin size={21} />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-brand">Visit Us</h2>
          <p className="mt-2 text-gray-600">Sagar Sports, Kharkhoda (131402), Haryana, India</p>
          <a
            href={MAP_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center rounded-md border border-brand px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
          >
            Open in Google Maps
          </a>
        </section>
      </div>
    </main>
  );
}

export default ContactPage;
