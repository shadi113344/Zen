import type { InputHTMLAttributes } from "react";

export type NumericInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "inputMode"> & {
  /** Use decimal keypad when values can include a fractional part. */
  decimal?: boolean;
};

/**
 * Mobile-friendly numeric field: shows the number keypad on phones (not full QWERTY).
 * Uses inputMode + pattern for iOS; type="text" avoids Safari's mixed number keyboard.
 */
export function NumericInput({ decimal = false, autoComplete = "off", ...props }: NumericInputProps) {
  return (
    <input
      {...props}
      type="text"
      inputMode={decimal ? "decimal" : "numeric"}
      pattern={decimal ? "[0-9]*[.,]?[0-9]*" : "[0-9]*"}
      autoComplete={autoComplete}
      enterKeyHint="done"
    />
  );
}
