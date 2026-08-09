type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const variantStyles: Record<string, string> = {
  primary: "bg-[#C8320A] text-white hover:bg-[#a22908] shadow-[0_16px_32px_rgba(200,50,10,0.18)]",
  secondary: "bg-white text-[#0B2942] border border-[#d6dfe9] hover:bg-[#f5f8fc]",
  ghost: "bg-transparent text-[#0B2942] hover:bg-[#ffffffcc]",
};

export default function ShellButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-[#0D3B66]/20 ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
