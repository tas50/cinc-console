"use client";

/**
 * Controlled description textarea — the editable body of the "Overview"
 * section, with no save chrome. Used by DescriptionEditor (which adds the
 * save lifecycle) and by the create form (which collects it into a draft).
 */
export function DescriptionField({
  value,
  onChange,
  disabled = false,
  id = "description",
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm text-muted">
        Description
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        disabled={disabled}
        className="w-full rounded-md border border-border bg-bg p-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
    </div>
  );
}
