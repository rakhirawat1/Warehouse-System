type FormMessageProps = {
  error?: string | null;
  success?: string | null;
};

export default function FormMessage({ error, success }: FormMessageProps) {
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-danger-muted bg-danger-muted p-3"
      >
        <p className="text-sm text-danger">{error}</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-lg border border-success-muted bg-success-muted p-3">
        <p className="text-sm text-success">{success}</p>
      </div>
    );
  }

  return null;
}
