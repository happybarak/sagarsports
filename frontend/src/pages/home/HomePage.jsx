import { useEffect } from "react";
import { FiShield, FiTruck, FiHeadphones } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import ProductGrid from "../../components/product/ProductGrid";
import {
  fetchBestSellers,
  fetchFeaturedProducts,
  fetchNewArrivals,
} from "../../redux/slices/productSlice";

function HeroSection() {
  return (
    <section className="bg-brand">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-6 py-16 text-white md:py-24">
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide">
          New season lineup
        </span>
        <h1 className="max-w-xl text-3xl font-bold leading-tight md:text-5xl md:leading-none">
          Move. Perform. Repeat.
        </h1>
        <p className="max-w-lg text-white/70">
          Sportswear built to keep up with training, competition, and everyday movement.
        </p>
        <Link
          to="/products"
          className="mt-2 rounded-md bg-brand-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-accent/90"
        >
          Shop all products
        </Link>
      </div>
    </section>
  );
}

function FeaturedCategories({ categories }) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h2 className="mb-5 text-xl font-bold text-brand md:text-2xl">Shop by Category</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {categories.slice(0, 4).map((category) => (
          <Link
            key={category.id}
            to={`/category/${category.slug}`}
            className="group flex flex-col items-center gap-3 rounded-lg border border-gray-100 bg-white p-3 text-center transition hover:shadow-md"
          >
            <div className="h-36 w-full overflow-hidden rounded-lg bg-brand-surface">
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-3xl font-bold text-brand">
                  {category.name.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-sm font-semibold text-gray-700">{category.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PromoBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6">
      <div className="flex flex-col items-center justify-between gap-4 rounded-xl bg-brand-accent/10 px-6 py-8 text-center sm:flex-row sm:text-left">
        <div>
          <h3 className="text-lg font-bold text-brand">Upgrade your setup this month</h3>
          <p className="text-sm text-gray-600">
            Selected laptops and accessories at their lowest prices yet.
          </p>
        </div>
        <Link
          to="/products?best_seller=true"
          className="shrink-0 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-light"
        >
          See deals
        </Link>
      </div>
    </section>
  );
}

function ValueProps() {
  const props = [
    { icon: FiTruck, title: "Fast delivery", body: "Reliable shipping across India." },
    { icon: FiShield, title: "Easy returns", body: "Simple returns on eligible products." },
    { icon: FiHeadphones, title: "Quality gear", body: "Sportswear made for everyday performance." },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {props.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex items-start gap-3 rounded-lg border border-gray-100 p-5">
            <Icon className="mt-1 text-brand-accent" size={22} />
            <div>
              <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
              <p className="text-sm text-gray-500">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HomePage() {
  const dispatch = useDispatch();
  const { items: categories } = useSelector((state) => state.categories);
  const { featured, bestSellers, newArrivals } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    dispatch(fetchBestSellers());
    dispatch(fetchNewArrivals());
  }, [dispatch]);

  return (
    <>
      <HeroSection />
      <FeaturedCategories categories={categories} />
      <ProductGrid
        title="Trending Sportswear"
        subtitle="Handpicked products, updated regularly"
        items={featured.items}
        status={featured.status}
      />
      <PromoBanner />
      <ProductGrid
        title="Best Sellers"
        items={bestSellers.items}
        status={bestSellers.status}
      />
      <ProductGrid
        title="New Season"
        items={newArrivals.items}
        status={newArrivals.status}
      />
      <ValueProps />
    </>
  );
}

export default HomePage;
