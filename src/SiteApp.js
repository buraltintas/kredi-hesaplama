import React from "react";
import AdminPage from "./admin/AdminSecurePage";
import LandingPage from "./landing/LandingPage";
import RequestPage from "./request/RequestPage";

function SiteApp() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";

  if (path === "/admin" || path.startsWith("/admin/")) {
    return <AdminPage />;
  }

  const requestPrefix = ["/request/", "/r/"].find((prefix) =>
    path.startsWith(prefix)
  );

  if (requestPrefix) {
    return (
      <RequestPage
        requestId={decodeURIComponent(path.slice(requestPrefix.length))}
      />
    );
  }

  return <LandingPage />;
}

export default SiteApp;
