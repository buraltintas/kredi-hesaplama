import styles from "../App.module.css";

const Metric = ({ label, value, highlighted = false }) => (
  <div className={`${styles.metric} ${highlighted ? styles.metricHighlighted : ""}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

export default Metric;
