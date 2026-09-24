export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-64 rounded-lg bg-border" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-xl bg-surface" />
        ))}
      </div>

      <div className="h-64 rounded-xl bg-surface" />
    </div>
  );
}
