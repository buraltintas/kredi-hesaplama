import React from "react";
import styles from "./Footer.module.css";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <p className={styles.copyright}>
        Copyright &copy; 2021 by Burak Altıntaş. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
