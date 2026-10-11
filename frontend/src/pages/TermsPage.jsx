function TermsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
      <div className="max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-accent">
          Legal
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-brand sm:text-4xl">
          Terms &amp; Conditions
        </h1>
      </div>

      <div className="mt-10 flex max-w-3xl flex-col gap-6">
        <section className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-semibold text-brand">Using the Store</h2>
          <p className="mt-3 leading-7 text-gray-600">
            By using Sagar Sports, you agree to provide accurate information and to use the website for lawful purchases.
          </p>
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-semibold text-brand">Orders &amp; Pricing</h2>
          <p className="mt-3 leading-7 text-gray-600">
            Product availability and pricing may change. The applicable price and availability are shown at checkout and confirmed when the order is placed. Cash on Delivery orders carry an additional ₹100 COD charge.
          </p>
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-semibold text-brand">Returns</h2>
          <p className="mt-3 leading-7 text-gray-600">
            Returns and exchanges are governed by our 7-day Return &amp; Exchange Policy.
          </p>
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-semibold text-brand">Questions</h2>
          <p className="mt-3 leading-7 text-gray-600">
            For questions, call us on 9255552245.
          </p>
        </section>
      </div>
    </main>
  );
}

export default TermsPage;
