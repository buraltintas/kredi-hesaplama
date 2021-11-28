import React, { useState } from "react";
import styles from "./AddData.module.css";
import Card from "../RenderCredit/Card";

const AddData = (props) => {
  const prefix = "₺ ";

  const [enteredCreditAmount, setEnteredCreditAmount] = useState("");
  const [enteredMonths, setEnteredMonths] = useState("");
  const [enteredInterestRate, setEnteredInterestRate] = useState("");
  const [enteredBsmv, setEnteredBsmv] = useState("");
  const [enteredKkdf, setEnteredKkdf] = useState("");

  const addDataHandler = (event) => {
    event.preventDefault();
    props.onAddData(
      enteredCreditAmount,
      enteredMonths,
      enteredInterestRate,
      enteredBsmv,
      enteredKkdf
    );
  };

  const creditAmountHandler = (event) => {
    setEnteredCreditAmount(event.target.value);
  };

  const monthsHandler = (event) => {
    setEnteredMonths(event.target.value);
  };

  const interestRateHandler = (event) => {
    setEnteredInterestRate(event.target.value);
  };

  const bsmvHandler = (event) => {
    setEnteredBsmv(event.target.value);
  };

  const kkdfHandler = (event) => {
    setEnteredKkdf(event.target.value);
  };

  return (
    <Card className={styles.input}>
      <form onSubmit={addDataHandler}>
        <label htmlFor="amount">Kredi Tutarı (TL)</label>
        <input
          value={enteredCreditAmount}
          prefix={prefix}
          id="amount"
          type="number"
          min="1000"
          placeholder="ör: 10000"
          onChange={creditAmountHandler}
          value={enteredCreditAmount}
          decimalSeparator=","
          groupSeparator="."
          required
        />
        <label htmlFor="months">Vade (ay)</label>
        <input
          id="months"
          type="number"
          min="1"
          placeholder="ör: 36"
          onChange={monthsHandler}
          value={enteredMonths}
          required
        />
        <label htmlFor="interest-rate">Kredi Faiz Oranı (%)</label>
        <input
          id="interest-rate"
          type="number"
          step="0.01"
          placeholder="ör: 1.65"
          min="0,01"
          onChange={interestRateHandler}
          value={enteredInterestRate}
          required
        />
        <label htmlFor="bsmv">BSMV Oranı (%)</label>
        <input
          id="bsmv"
          type="number"
          placeholder="ör: 5"
          onChange={bsmvHandler}
          value={enteredBsmv}
          min="0"
          required
        />
        <label htmlFor="kkdf">KKDF Oranı (%)</label>
        <input
          id="kkdf"
          type="number"
          placeholder="ör: 15"
          onChange={kkdfHandler}
          value={enteredKkdf}
          min="0"
          required
        />
        <div className={styles.btn}>
          <button className={styles.button} type="submit">
            Hesapla
          </button>
        </div>
      </form>
    </Card>
  );
};

export default AddData;
