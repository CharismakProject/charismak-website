type FieldProps = {
  label: string;
  description?: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
};

export default function Field({ label, description, htmlFor, children, className = "" }: FieldProps) {
  return (
    <label className={`block text-sm font-medium text-[#0B2942] ${className}`} htmlFor={htmlFor}>
      <span>{label}</span>
      {description ? <span className="mt-1 block text-xs text-[#556475]">{description}</span> : null}
      <div className="mt-2">{children}</div>
    </label>
  );
}
