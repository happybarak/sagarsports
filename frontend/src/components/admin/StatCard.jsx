function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-100 bg-white p-5">
      {Icon && (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent">
          <Icon size={20} />
        </div>
      )}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-xl font-bold text-brand">{value}</p>
      </div>
    </div>
  );
}

export default StatCard;
