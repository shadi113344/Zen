import { NumericInput } from "@/components/NumericInput";

interface FormNumericStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  "aria-label"?: string;
}

export function FormNumericStepper({
  value,
  onChange,
  min = 0,
  max = 99999,
  step = 1,
  placeholder,
  "aria-label": ariaLabel,
}: FormNumericStepperProps) {
  const bump = (direction: 1 | -1) => {
    const next = value + direction * step;
    onChange(Math.min(max, Math.max(min, next)));
  };

  return (
    <div className="form-numeric-stepper">
      <button
        type="button"
        className="habit-card__step"
        onClick={() => bump(-1)}
        disabled={value <= min}
        aria-label="Decrease"
      >
        −
      </button>
      <NumericInput
        value={String(value)}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          if (digits === "") return;
          onChange(Math.min(max, Math.max(min, Number(digits))));
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="form-numeric-stepper__input"
      />
      <button
        type="button"
        className="habit-card__step"
        onClick={() => bump(1)}
        disabled={value >= max}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
