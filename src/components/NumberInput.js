import styles from "../App.module.css";
import { sanitizeNumericInput } from "../loanEngine";

const NumberInput = ({
  label,
  mode = "decimal",
  value,
  onChange,
  placeholder,
  disabled = false,
}) => (
  <label className={styles.field}>
    <span>{label}</span>
    <input
      value={value}
      inputMode={mode === "integer" ? "numeric" : "decimal"}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(event) => onChange(sanitizeNumericInput(event.target.value, mode))}
    />
  </label>
);

export default NumberInput;
