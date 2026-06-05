interface FabButtonProps {
  onClick: () => void;
  label: string;
  className?: string;
}

export function FabButton({ onClick, label, className }: FabButtonProps) {
  const cls = ["fab", className ?? ""].filter(Boolean).join(" ");
  return (
    <button type="button" className={cls} onClick={onClick} aria-label={label}>
      +
    </button>
  );
}
