import { FiTrash2 } from "react-icons/fi";
import { Link } from "react-router-dom";

function CartLineItem({ item, onQuantityChange, onRemove, isUpdating }) {
  const { product, variant, quantity, unit_price: unitPrice, line_total: lineTotal } = item;
  const availableStock = variant ? variant.stock : product.stock;

  return (
    <div className="flex gap-4 border-b border-gray-100 py-4">
      <Link
        to={`/products/${product.slug}`}
        className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-brand-surface"
      >
        {product.primary_image ? (
          <img
            src={product.primary_image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
            No image
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1">
        <Link
          to={`/products/${product.slug}`}
          className="text-sm font-medium text-gray-800 hover:text-brand-accent"
        >
          {product.name}
        </Link>
        {variant && (
          <span className="text-xs text-gray-500">
            {variant.variant_type_display}: {variant.value}
          </span>
        )}
        <span className="text-sm font-semibold text-brand">
          ₹{Number(unitPrice).toLocaleString("en-IN")}
        </span>

        <div className="mt-1 flex items-center gap-3">
          <div className="flex items-center rounded-md border border-gray-200">
            <button
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              disabled={isUpdating}
              className="px-2.5 py-1 text-gray-500 hover:text-brand-accent disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-7 text-center text-sm">{quantity}</span>
            <button
              onClick={() => onQuantityChange(Math.min(availableStock, quantity + 1))}
              disabled={isUpdating || quantity >= availableStock}
              className="px-2.5 py-1 text-gray-500 hover:text-brand-accent disabled:opacity-40"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button
            onClick={onRemove}
            disabled={isUpdating}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500"
          >
            <FiTrash2 size={14} />
            Remove
          </button>
        </div>
      </div>

      <div className="text-right text-sm font-semibold text-brand">
        ₹{Number(lineTotal).toLocaleString("en-IN")}
      </div>
    </div>
  );
}

export default CartLineItem;
