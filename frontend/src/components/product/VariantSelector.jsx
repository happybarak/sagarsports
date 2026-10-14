function VariantSelector({ variants, selected, onSelect }) {
  if (!variants || variants.length === 0) {
    return null;
  }

  const groups = variants.reduce((acc, variant) => {
    acc[variant.variant_type] = acc[variant.variant_type] || [];
    acc[variant.variant_type].push(variant);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(groups).map(([variantType, options]) => (
        <div key={variantType}>
          <h3 className="mb-2 text-sm font-semibold text-gray-800">
            {options[0].variant_type_display}
          </h3>
          <div className="flex flex-wrap gap-2">
            {options.map((option) => {
              const isSelected = selected[variantType] === option.id;
              const isOutOfStock = option.stock <= 0;
              return (
                <button
                  key={option.id}
                  disabled={isOutOfStock}
                  onClick={() => onSelect(variantType, option)}
                  className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                    isSelected
                      ? "border-brand bg-brand text-white"
                      : "border-gray-200 text-gray-700 hover:border-brand-accent"
                  } ${isOutOfStock ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  {option.value}
                  {option.price_delta !== "0.00" && (
                    <span className="ml-1 text-xs opacity-80">
                      ({Number(option.price_delta) > 0 ? "+" : ""}
                      ₹{Number(option.price_delta).toLocaleString("en-IN")})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default VariantSelector;
