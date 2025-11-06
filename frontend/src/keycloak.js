import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://localhost:8080/",
  realm: "myrealm", //realm name for project in keycloak
  clientId: "react-client",
});

export default keycloak;
