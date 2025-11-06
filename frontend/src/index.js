import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "./keycloak";
import { CssBaseline } from "@mui/material";
// import LoadingPage from "./components/common/loadingpage";

function renderApp() {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <ReactKeycloakProvider authClient={keycloak}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ReactKeycloakProvider>
    </React.StrictMode>
  );
}

keycloak
  .init({
    onLoad: "login-required", 
    checkLoginIframe: false,
    pkceMethod: "S256",
  })
  .then((authenticated) => {
    if (authenticated) {
      console.log("User authenticated:", keycloak.token);
      renderApp(); 
    } else {
      keycloak.login(); 
    }
  })
  .catch((error) => {
    console.error("Keycloak init failed:", error);
  });


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <CssBaseline>
    <div>loading</div>
    {/* <LoadingPage /> */}
  </CssBaseline>
);
