function ReturnExchangePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
      <div className="max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-accent">
          Customer Policy
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-brand sm:text-4xl">
          Return &amp; Exchange Policy
        </h1>
        <p className="mt-5 text-lg leading-8 text-gray-600">
          We want you to be satisfied with your purchase. Eligible products can
          be returned or exchanged within <strong>7 days of delivery</strong>,
          subject to the conditions below.
        </p>
      </div>

      <div className="mt-10 space-y-6">
        <section className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-semibold text-brand">7-Day Return &amp; Exchange</h2>
          <p className="mt-3 leading-7 text-gray-600">
            Contact us within 7 days of delivery if you receive a damaged,
            defective, incorrect, or otherwise eligible product.
          </p>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-semibold text-brand">Eligibility Conditions</h2>
          <ul className="mt-3 space-y-2 text-gray-600">
            <li>• The product must be unused and in its original condition.</li>
            <li>• Original packaging, tags, accessories, and invoice should be retained where applicable.</li>
            <li>• Products showing signs of use, damage, or alteration may not be eligible.</li>
            <li>• Personalized or customized products may not be eligible for return or exchange.</li>
            <li>• Products specifically marked as non-returnable on the product page are not eligible.</li>
          </ul>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-semibold text-brand">How to Request a Return or Exchange</h2>
          <ol className="mt-3 space-y-3 text-gray-600">
            <li><strong>1.</strong> Call us at <a className="font-semibold text-brand-accent hover:underline" href="tel:9255552245">9255552245</a>.</li>
            <li><strong>2.</strong> Provide your Order ID and explain the reason for the request.</li>
            <li><strong>3.</strong> If required, provide photographs or videos showing the package and product condition.</li>
            <li><strong>4.</strong> Our team will review the request and provide further instructions.</li>
          </ol>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-semibold text-brand">Cash on Delivery</h2>
          <p className="mt-3 leading-7 text-gray-600">
            Cash on Delivery (COD) orders carry an additional <strong>₹100 COD charge</strong>.
            This charge is separate from the product price and applicable shipping charges.
          </p>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-semibold text-brand">Refunds</h2>
          <p className="mt-3 leading-7 text-gray-600">
            Once an approved return is received and inspected, the refund will
            be processed according to the applicable payment method and our
            refund terms. The time taken for a refund to appear may depend on
            your bank or payment provider.
          </p>
        </section>
      </div>
    </main>
  );
}

export default ReturnExchangePage;
