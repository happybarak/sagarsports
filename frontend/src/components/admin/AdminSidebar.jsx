import {
  FiBarChart2,
  FiBox,
  FiGrid,
  FiPackage,
  FiShoppingBag,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: FiGrid, end: true },
  { to: "/admin/products", label: "Products", icon: FiBox },
  { to: "/admin/categories", label: "Categories", icon: FiPackage },
  { to: "/admin/orders", label: "Orders", icon: FiShoppingBag },
  { to: "/admin/users", label: "Users", icon: FiUsers },
  { to: "/admin/inventory", label: "Inventory", icon: FiBarChart2 },
  { to: "/admin/analytics", label: "Analytics", icon: FiTrendingUp },
];

function AdminSidebar() {
  return (
    <nav className="w-56 shrink-0 border-r border-gray-100 bg-white">
      <div className="px-4 py-5">
        <span className="text-lg font-bold text-brand">Sagar Sports Admin</span>
      </div>
      <ul className="flex flex-col gap-1 px-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-surface text-brand-accent"
                    : "text-gray-600 hover:bg-brand-surface"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default AdminSidebar;
