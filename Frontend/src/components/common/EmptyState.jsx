export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-12 text-center animate-fade-enter">
      {Icon && (
        <div className="mb-3 rounded-md border border-zinc-200 bg-zinc-50 p-2.5 text-zinc-500">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h4 className="text-sm font-semibold text-zinc-900">{title}</h4>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-zinc-500 leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
