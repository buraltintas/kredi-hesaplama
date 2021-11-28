import React, { useState } from "react";
import AddData from "./AddData/AddData";
import Card from "./RenderCredit/Card";
import styles from "./App.module.css";
import Footer from "./Footer";

function App() {
  const [creditData, setCreditData] = useState([]);

  const addDataHandler = (amount, months, rate, bsmv, kkdf) => {
    setCreditData(() => {
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
              <h3>Kredi tutarı</h3>
              <h2>
                {item.creditAmount.toLocaleString("tr-TR", {
                  style: "currency",
                  currency: "TRY",
                })}
              </h2>
              <h3>Kredi vadesi</h3>
              <h2>{item.creditMonths} ay</h2>
              <h3>Kredi faiz oranı</h3>
              <h2>%{item.creditRate}</h2>
              <h3>Taksit tutarı</h3>
              <h2>
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
              </h2>
              <h3>Toplam geri ödeme</h3>
              <h2>
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
              </h2>
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
