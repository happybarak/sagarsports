import { useState } from "react";
import { FiInstagram, FiMapPin, FiPhone } from "react-icons/fi";
import { Link } from "react-router-dom";

const INSTAGRAM_URL = "https://www.instagram.com/sagarsportskharkhoda/";
const MAP_URL = "https://maps.app.goo.gl/yxHQeZbnPVab2bqH6?g_st=ac";
const PHONE_NUMBER = "9255552245";

function Footer({ categories }) {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  const handleNewsletterSubmit = (event) => {
    event.preventDefault();
    setNewsletterSubmitted(true);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  return (
    <footer className="mt-16 bg-brand text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="mb-3 text-lg font-bold">SagarSports</h3>
          <p className="text-sm leading-6 text-white/70">
            Quality sports equipment and accessories manufactured in our own
            factory for players who want to move, perform, and play with confidence.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Sagar Sports on Instagram"
              title="Instagram"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/15"
            >
              <FiInstagram size={19} />
            </a>
            <a
              href={MAP_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Sagar Sports location on Google Maps"
              title="Location"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/15"
            >
              <FiMapPin size={19} />
            </a>
            <a
              href={`tel:${PHONE_NUMBER}`}
              aria-label={`Call Sagar Sports at ${PHONE_NUMBER}`}
              title="Call us"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/15"
            >
              <FiPhone size={18} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">
            Shop
          </h4>
          <ul className="flex flex-col gap-2 text-sm text-white/80">
            {categories.slice(0, 5).map((category) => (
              <li key={category.id}>
                <Link
                  to={`/category/${category.slug}`}
                  onClick={scrollToTop}
                  className="hover:text-white"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">
            Company
          </h4>
          <ul className="flex flex-col gap-2 text-sm text-white/80">
            <li><Link to="/about" onClick={scrollToTop} className="hover:text-white">About Us</Link></li>
            <li><Link to="/contact" onClick={scrollToTop} className="hover:text-white">Contact Us</Link></li>
            <li><Link to="/returns-exchanges" onClick={scrollToTop} className="hover:text-white">Return &amp; Exchange Policy</Link></li>
            <li><Link to="/faq" onClick={scrollToTop} className="hover:text-white">FAQs</Link></li>
            <li><Link to="/privacy" onClick={scrollToTop} className="hover:text-white">Privacy Policy</Link></li>
            <li><Link to="/terms" onClick={scrollToTop} className="hover:text-white">Terms &amp; Conditions</Link></li>
          </ul>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-wide text-white/50">Location</p>
            <a
              href={MAP_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-start gap-2 text-sm text-white/80 hover:text-white"
            >
              <FiMapPin className="mt-0.5 shrink-0" size={16} />
              <span>Sagar Sports, Kharkhoda (131402), Haryana, India</span>
            </a>
          </div>

          <div className="mt-4 border-t border-white/10 pt-3 text-xs text-white/60">
            <p className="font-semibold text-white/80">Grievance Redressal:</p>
            <p>Officer: Sagar Sports Redressal Desk</p>
            <p>Email: <a href="mailto:orders@sagarsports.shop" className="underline hover:text-white">orders@sagarsports.shop</a></p>
            <p>Phone: <a href={`tel:${PHONE_NUMBER}`} className="underline hover:text-white">{PHONE_NUMBER}</a></p>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">
            Stay in the loop
          </h4>
          {newsletterSubmitted ? (
            <p className="text-sm text-white/80">Thanks — you&apos;re on the list.</p>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
              />
              <button
                type="submit"
                className="shrink-0 rounded-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white hover:bg-brand-accent/90"
              >
                Join
              </button>
            </form>
          )}

          <a
            href={`tel:${PHONE_NUMBER}`}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <FiPhone size={17} />
            Contact Us: {PHONE_NUMBER}
          </a>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} SagarSports. All rights reserved. &bull; 100% Made in India
      </div>
    </footer>
  );
}

export default Footer;
