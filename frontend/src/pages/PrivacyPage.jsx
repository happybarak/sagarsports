function PrivacyPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
      <div className="max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-accent">
          Legal
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-brand sm:text-4xl">
          Privacy Policy
        </h1>
      </div>

      <div className="mt-10 flex max-w-3xl flex-col gap-6">
        <section className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-semibold text-brand">Information We Collect</h2>
          <p className="mt-3 leading-7 text-gray-600">
            Depending on how you use the store, this may include your name, phone number, email address, shipping address and order information.
          </p>
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-semibold text-brand">How We Use It</h2>
          <p className="mt-3 leading-7 text-gray-600">
            We use this information to process and deliver orders, communicate about them, handle returns and exchanges, provide support and keep accounts secure.
          </p>
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-semibold text-brand">Payment Details</h2>
          <p className="mt-3 leading-7 text-gray-600">
            We do not ask for or store card details in this website&apos;s demo payment flow.
          </p>
        </section>
      </div>
    </main>
  );
}

export default PrivacyPage;
