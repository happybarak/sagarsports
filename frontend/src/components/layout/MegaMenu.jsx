import { useState } from "react";
import { Link } from "react-router-dom";

function MegaMenu({ categories }) {
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <nav className="relative hidden border-t border-gray-100 bg-white md:block">
      <ul className="mx-auto flex max-w-7xl items-center gap-1 px-6">
        {categories.map((category) => (
          <li
            key={category.id}
            onMouseEnter={() => setActiveCategoryId(category.id)}
            onMouseLeave={() => setActiveCategoryId(null)}
            className="relative"
          >
            <Link
              to={`/category/${category.slug}`}
              className="block px-4 py-3 text-sm font-medium text-gray-700 transition hover:text-brand-accent"
            >
              {category.name}
            </Link>

            {activeCategoryId === category.id && category.children?.length > 0 && (
              <div className="absolute left-0 top-full z-40 min-w-[520px] rounded-b-lg border border-gray-100 bg-white p-5 shadow-lg">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  {category.children.map((child) => (
                    <div key={child.id}>
                      <Link
                        to={`/category/${child.slug}`}
                        className="block px-5 py-2 text-sm text-gray-600 transition hover:bg-brand-surface hover:text-brand-accent"
                      >
                        {child.name}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default MegaMenu;
