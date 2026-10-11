import { useState } from "react";
import { FiChevronDown, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";

function MobileNav({ categories, isAuthenticated, onClose }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpanded = (categoryId) => {
    setExpandedId((current) => (current === categoryId ? null : categoryId));
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85%] flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
          <img
            src="/sagar-sports-logo.png"
            alt="SagarSports — kharkhoda"
            className="h-9 w-auto"
          />
          <button onClick={onClose} aria-label="Close menu" className="p-1 text-gray-500">
            <FiX size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul>
            {categories.map((category) => (
              <li key={category.id} className="border-b border-gray-50">
                <div className="flex items-center justify-between">
                  <Link
                    to={`/category/${category.slug}`}
                    onClick={onClose}
                    className="flex-1 px-3 py-3 text-sm font-medium text-gray-800"
                  >
                    {category.name}
                  </Link>
                  {category.children?.length > 0 && (
                    <button
                      onClick={() => toggleExpanded(category.id)}
                      aria-label={`Toggle ${category.name} submenu`}
                      className="p-3 text-gray-400"
                    >
                      <FiChevronDown
                        className={`transition-transform ${
                          expandedId === category.id ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>

                {expandedId === category.id && category.children?.length > 0 && (
                  <ul className="bg-brand-surface pb-2">
                    {category.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          to={`/category/${child.slug}`}
                          onClick={onClose}
                          className="block px-6 py-2 text-sm text-gray-600"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-gray-100 p-4">
          {isAuthenticated ? (
            <Link
              to="/profile"
              onClick={onClose}
              className="block rounded-md bg-brand px-4 py-2 text-center text-sm font-semibold text-white"
            >
              My Account
            </Link>
          ) : (
            <div className="flex gap-2">
              <Link
                to="/login"
                onClick={onClose}
                className="flex-1 rounded-md border border-brand px-4 py-2 text-center text-sm font-semibold text-brand"
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="flex-1 rounded-md bg-brand px-4 py-2 text-center text-sm font-semibold text-white"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MobileNav;
