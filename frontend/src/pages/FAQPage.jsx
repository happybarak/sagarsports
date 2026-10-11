const PHONE = "9255552245";

const FAQS = [
  ["Do you offer Cash on Delivery?", "Yes. COD is available with an additional ₹100 COD charge."],
  ["What is the return period?", "Eligible products can be returned or exchanged within 7 days of delivery."],
  ["Where are your products manufactured?", "Our products are manufactured in our own factory."],
  ["How can I contact Sagar Sports?", `Call us at ${PHONE}.`],
  ["Where is Sagar Sports located?", "Kharkhoda (131402), Haryana, India."],
];

function FAQPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
      <div className="max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-accent">
          Help
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-brand sm:text-4xl">
          Frequently Asked Questions
        </h1>
      </div>

      <div className="mt-10 max-w-3xl divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white px-7 shadow-sm">
        {FAQS.map(([question, answer]) => (
          <details key={question} className="py-5">
            <summary className="cursor-pointer font-semibold text-gray-800">{question}</summary>
            <p className="mt-3 leading-7 text-gray-600">{answer}</p>
          </details>
        ))}
      </div>
    </main>
  );
}

export default FAQPage;
