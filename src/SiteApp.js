import React from "react";
import AdminPage from "./admin/AdminSecurePage";
import LandingPage from "./landing/LandingPage";

function SiteApp() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";

  if (path === "/admin" || path.startsWith("/admin/")) {
    return <AdminPage />;
  }

  return <LandingPage />;
}

export default SiteApp;
