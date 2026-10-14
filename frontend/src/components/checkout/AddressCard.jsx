function AddressCard({ address, isSelected, onSelect, actions }) {
  const Wrapper = onSelect ? "button" : "div";

  return (
    <Wrapper
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition ${
        isSelected ? "border-brand-accent bg-brand-accent/5" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {onSelect && (
        <span
          className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${
            isSelected ? "border-brand-accent bg-brand-accent" : "border-gray-300"
          }`}
        />
      )}
      <div className="flex-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800">{address.full_name}</span>
          {address.is_default && (
            <span className="rounded bg-brand-surface px-1.5 py-0.5 text-xs text-gray-500">
              Default
            </span>
          )}
        </div>
        <p className="mt-0.5 text-gray-500">
          {address.address_line_1}
          {address.address_line_2 && `, ${address.address_line_2}`}, {address.city},{" "}
          {address.state} {address.postal_code}
        </p>
        <p className="text-gray-400">{address.phone}</p>
      </div>
      {actions && <div className="flex shrink-0 gap-3 text-xs">{actions}</div>}
    </Wrapper>
  );
}

export default AddressCard;
