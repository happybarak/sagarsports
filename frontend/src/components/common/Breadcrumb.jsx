import { Link } from "react-router-dom";

function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-500">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1">
              {item.to && !isLast ? (
                <Link to={item.to} className="hover:text-brand-accent">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "font-medium text-gray-700" : ""}>
                  {item.label}
                </span>
              )}
              {!isLast && <span className="text-gray-300">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
