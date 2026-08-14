import { forwardRef } from "react";
import ReactDatePicker, { registerLocale } from "react-datepicker";
import tr from "date-fns/locale/tr";
import "react-datepicker/dist/react-datepicker.css";
import styles from "../App.module.css";
import { formatDateForInput } from "../loanEngine";

registerLocale("tr", tr);

const DatePickerButton = forwardRef(({ value, onClick, label }, ref) => (
  <button
    aria-label={label}
    className={styles.datePickerButton}
    ref={ref}
    type="button"
    onClick={onClick}
  >
    {value}
  </button>
));

DatePickerButton.displayName = "DatePickerButton";

const DateInput = ({ label, value, min, onChange }) => (
  <label className={styles.field}>
    <span>{label}</span>
    <ReactDatePicker
      calendarClassName={styles.datePickerCalendar}
      customInput={<DatePickerButton label={label} />}
      dateFormat="dd MMM yyyy"
      locale="tr"
      minDate={min}
      popperPlacement="bottom-start"
      selected={value}
      shouldCloseOnSelect
      showPopperArrow={false}
      withPortal={
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 640px)").matches
      }
      wrapperClassName={styles.datePickerWrapper}
      onChange={(date) => {
        if (date) {
          onChange(formatDateForInput(date));
        }
      }}
    />
  </label>
);

export default DateInput;
