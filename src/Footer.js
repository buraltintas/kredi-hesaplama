import React from "react";
import styles from "./Footer.module.css";
import "./Footer-logo.css";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div>
        <a href="https://www.instagram.com/xewor/">
          <ion-icon class="social-icon" name="logo-instagram"></ion-icon>
        </a>
        <a href="https://www.facebook.com/profile.php?id=616346676">
          <ion-icon class="social-icon" name="logo-facebook"></ion-icon>
        </a>
        <a href="https://twitter.com/burak_alti">
          <ion-icon class="social-icon" name="logo-twitter"></ion-icon>
        </a>
        <a href="https://www.linkedin.com/in/burak-alt%C4%B1nta%C5%9F-8b796b1b8/">
          <ion-icon class="social-icon" name="logo-linkedin"></ion-icon>
        </a>
        <a href="https://github.com/buraltintas">
          <ion-icon class="social-icon" name="logo-github"></ion-icon>
        </a>
      </div>
      <p className={styles.copyright}>
        Copyright &copy; 2021 by Burak Altıntaş. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
