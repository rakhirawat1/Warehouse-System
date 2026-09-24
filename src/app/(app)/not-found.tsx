import Button from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-lg border border-border bg-surface text-center shadow-card">
        <h1 className="text-xl text-primary">Not found</h1>

        <p className="mt-2 text-sm text-secondary">
          This page does not exist, or the record was deleted.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Button href="/dashboard">Go to dashboard</Button>

          <Button href="/warehouses" variant="secondary">
            View warehouses
          </Button>
        </div>
      </div>
    </div>
  );
}
