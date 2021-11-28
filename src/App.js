import React, { useState } from "react";
import AddData from "./AddData/AddData";
import Card from "./RenderCredit/Card";
import styles from "./App.module.css";
import Footer from "./Footer";

function App() {
  const [creditData, setCreditData] = useState([]);

  const addDataHandler = (amount, months, rate, bsmv, kkdf) => {
    setCreditData(() => {
      console.log(amount, months, rate, bsmv, kkdf);
      return [
        {
          creditAmount: +amount,
          creditMonths: +months,
          creditRate: +rate,
          creditBsmv: +bsmv,
          creditKkdf: +kkdf,
          id: Math.random().toString(),
        },
      ];
    });
  };

  return (
    <div>
      <AddData onAddData={addDataHandler} />
      {creditData.length ? (
        <Card className={styles.creditRender}>
          {creditData.map((item) => (
            <div key={item.id}>
              <h2>Kredi tutarı</h2>
              <h3>
                {item.creditAmount.toLocaleString("tr-TR", {
                  style: "currency",
                  currency: "TRY",
                })}
              </h3>
              <h2>Kredi vadesi</h2>
              <h3>{item.creditMonths} ay</h3>
              <h2>Kredi faiz oranı</h2>
              <h3>%{item.creditRate}</h3>
              <h2>Taksit tutarı</h2>
              <h3>
                {parseFloat(
                  (item.creditAmount *
                    ((item.creditRate / 100) *
                      (1 + item.creditKkdf / 100 + item.creditBsmv / 100))) /
                    (1 -
                      1 /
                        Math.pow(
                          1 +
                            (item.creditRate / 100) *
                              (1 +
                                item.creditKkdf / 100 +
                                item.creditBsmv / 100),
                          item.creditMonths
                        ))
                ).toLocaleString("tr-TR", {
                  style: "currency",
                  currency: "TRY",
                })}
              </h3>
              <h2>Toplam geri ödeme</h2>
              <h3>
                {parseFloat(
                  (item.creditMonths *
                    (item.creditAmount *
                      ((item.creditRate / 100) *
                        (1 + item.creditKkdf / 100 + item.creditBsmv / 100)))) /
                    (1 -
                      1 /
                        Math.pow(
                          1 +
                            (item.creditRate / 100) *
                              (1 +
                                item.creditKkdf / 100 +
                                item.creditBsmv / 100),
                          item.creditMonths
                        ))
                ).toLocaleString("tr-TR", {
                  style: "currency",
                  currency: "TRY",
                })}
              </h3>
            </div>
          ))}
        </Card>
      ) : (
        ""
      )}
      <Footer />
    </div>
  );
}

export default App;
