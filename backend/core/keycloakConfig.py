import os

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8080")  #keycloak tenant url
REALM = os.getenv("KEYCLOAK_REALM", "myrealm")

# react frontend client id (public)
REACT_CLIENT_ID = os.getenv("REACT_CLIENT_ID", "react-client")

#fastapi backend client id (confidential)
BACKEND_CLIENT_ID = os.getenv("BACKEND_CLIENT_ID", "fastapi-backend")

ISSUER = f"{KEYCLOAK_URL}/realms/{REALM}"
JWKS_URL = f"{ISSUER}/protocol/openid-connect/certs"
