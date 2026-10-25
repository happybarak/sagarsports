import { useEffect, useRef, useState } from "react";
import { FiMenu, FiSearch, FiShoppingCart, FiUser } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

import useDebounce from "../../hooks/useDebounce";
import { logoutUser } from "../../redux/slices/authSlice";
import { fetchCart } from "../../redux/slices/cartSlice";
import { clearWishlist } from "../../redux/slices/wishlistSlice";
import productService from "../../services/productService";
import MegaMenu from "./MegaMenu";
import MobileNav from "./MobileNav";

function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: categories } = useSelector((state) => state.categories);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { items: cartItems } = useSelector((state) => state.cart);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const searchContainerRef = useRef(null);

  const debouncedQuery = useDebounce(searchQuery, 250);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    productService.fetchSuggestions(trimmed).then((results) => {
      if (!cancelled) setSuggestions(results);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    // Close the suggestions dropdown on an outside click.
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goToSearchResults = (query) => {
    if (query.trim()) {
      setIsSuggestionsOpen(false);
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    goToSearchResults(searchQuery);
  };

  const handleSuggestionClick = (product) => {
    setIsSuggestionsOpen(false);
    setSearchQuery("");
    navigate(`/products/${product.slug}`);
  };

  const handleLogout = () => {
    setIsAccountMenuOpen(false);
    dispatch(logoutUser()).then(() => {
      dispatch(fetchCart());
      dispatch(clearWishlist());
    });
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm">
      <div className="mx-auto flex max-w-screen-2xl items-center gap-4 px-4 sm:px-6 lg:px-8 xl:px-12 py-3">
        <button
          onClick={() => setIsMobileNavOpen(true)}
          aria-label="Open menu"
          className="p-1 text-gray-600 md:hidden"
        >
          <FiMenu size={24} />
        </button>

        <Link to="/" className="flex shrink-0 items-center" aria-label="SagarSports home">
          <img
            src="/sagar-sports-logo.png"
            alt="SagarSports — kharkhoda"
            className="h-10 w-auto"
          />
        </Link>

        <form
          onSubmit={handleSearchSubmit}
          className="relative hidden flex-1 md:flex"
          ref={searchContainerRef}
        >
          <div className="relative w-full max-w-2xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setIsSuggestionsOpen(true);
              }}
              onFocus={() => setIsSuggestionsOpen(true)}
              placeholder="Search sportswear, shoes and accessories"
              autoComplete="off"
              className="w-full rounded-full border border-gray-200 bg-brand-surface py-2 pl-4 pr-10 text-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-accent"
            >
              <FiSearch size={18} />
            </button>

            {isSuggestionsOpen && suggestions.length > 0 && (
              <div className="absolute left-0 top-full z-40 mt-2 w-full overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg">
                {suggestions.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSuggestionClick(product)}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-brand-surface"
                  >
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded bg-brand-surface">
                      {product.primary_image && (
                        <img
                          src={product.primary_image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-gray-800">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.brand}</p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-brand">
                      ₹{Number(product.effective_price).toLocaleString("en-IN")}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>

        <div className="ml-auto flex items-center gap-4">
          <div className="relative hidden md:block">
            <button
              onClick={() => setIsAccountMenuOpen((open) => !open)}
              className="flex items-center gap-1 text-gray-600 hover:text-brand-accent"
            >
              <FiUser size={20} />
              <span className="text-sm font-medium">
                {isAuthenticated ? user?.first_name || "Account" : "Account"}
              </span>
            </button>

            {isAccountMenuOpen && (
              <div className="absolute right-0 top-full z-40 mt-2 w-44 rounded-md border border-gray-100 bg-white py-2 shadow-lg">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-surface"
                    >
                      My Profile
                    </Link>
                    {user?.is_staff && (
                      <Link
                        to="/admin"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="block px-4 py-2 text-sm font-medium text-brand-accent hover:bg-brand-surface"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-brand-surface"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-surface"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-surface"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <Link to="/cart" aria-label="Cart" className="relative text-gray-600 hover:text-brand-accent">
            <FiShoppingCart size={20} />
            {cartItemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-[10px] font-bold text-white">
                {cartItemCount > 9 ? "9+" : cartItemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <MegaMenu categories={categories} />

      {isMobileNavOpen && (
        <MobileNav
          categories={categories}
          isAuthenticated={isAuthenticated}
          onClose={() => setIsMobileNavOpen(false)}
        />
      )}
    </header>
  );
}

export default Header;
