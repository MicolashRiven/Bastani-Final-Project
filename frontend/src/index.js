import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

import Keycloak from "keycloak-js";
import { ReactKeycloakProvider } from "@react-keycloak/web";

import DarkVeil from './components/reactbits/Dark Veil/DarkVeil';
import ShinyText from "./components/reactbits/ShinyText/ShinyText";

import { Box, CssBaseline } from "@mui/material";

import LoadingPage from "./components/common/loadingpage";



const keycloak = new Keycloak({
  url: "http://localhost:8080/",
  realm: "myrealm",
  clientId: "react-frontend",
});

function Root() {


  const [keycloakReady, setKeycloakReady] = useState(false);
  const [minLoadingDone, setMinLoadingDone] = useState(false);

  useEffect(() => {

    const timer = setTimeout(() => setMinLoadingDone(true), 5000);

    keycloak
      .init({
        onLoad: "login-required",
        checkLoginIframe: false,
        pkceMethod: "S256", 
      })
      .then((authenticated) => {
        if (authenticated) {

          
          fetch("http://127.0.0.1:8000/me", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${keycloak.token}`,
              "Content-Type": "application/json"
            }
          })
            .then(response => {
              if (!response.ok) {
                throw new Error("Unauthorized or request failed");
              }
              return response.json();
            })
            .then(data => {
              console.log("Response data:", data);
            })
            .catch(error => {
              console.error("Error:", error);
            });

          setKeycloakReady(true);
        } else {
          keycloak.login();
        }
      })
      
      .catch((error) => console.error("Keycloak init failed:", error));

      return () => clearTimeout(timer);
  }, []);

  

  if (!keycloakReady || !minLoadingDone) {
    return (  
    <CssBaseline>
      <LoadingPage /> 
    </CssBaseline>       
  );
  }

  return (
    <ReactKeycloakProvider authClient={keycloak}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ReactKeycloakProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
