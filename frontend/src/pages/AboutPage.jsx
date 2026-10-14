function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
      <div className="max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-accent">
          About Sagar Sports
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-brand sm:text-4xl">
          Quality sports gear, made by us.
        </h1>
        <p className="mt-5 text-lg leading-8 text-gray-600">
          Welcome to Sagar Sports — your destination for quality sports equipment
          and accessories. We manufacture our products in our own factory, giving
          us greater control over quality, production, and pricing.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-semibold text-brand">Our Mission</h2>
          <p className="mt-3 leading-7 text-gray-600">
            Our mission is simple: to make quality sports equipment accessible to
            every player. By manufacturing our products ourselves, we work to
            maintain consistent quality while keeping our products competitively
            priced.
          </p>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-semibold text-brand">Why Choose Us?</h2>
          <ul className="mt-3 space-y-2 text-gray-600">
            <li>• Products manufactured in our own factory</li>
            <li>• Focus on quality and consistency</li>
            <li>• Competitive pricing</li>
            <li>• Reliable packaging and delivery</li>
            <li>• Customer-focused service</li>
          </ul>
        </section>
      </div>

      <div className="mt-10 rounded-xl bg-brand p-8 text-white">
        <p className="text-lg font-semibold">Play with confidence. Play with Sagar Sports.</p>
        <p className="mt-2 text-white/70">
          Whether you are starting your sporting journey or are an experienced
          player, we are here to help you play your best.
        </p>
      </div>
    </main>
  );
}

export default AboutPage;
