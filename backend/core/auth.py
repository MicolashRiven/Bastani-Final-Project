from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt import PyJWKClient, decode
from jwt.exceptions import InvalidTokenError
from .keycloakConfig import JWKS_URL, ISSUER
bearer_scheme = HTTPBearer()
_jwk_client = PyJWKClient(JWKS_URL)

def _verify_token(token: str, audience: Optional[str] = None) -> dict:
    try:
        signing_key = _jwk_client.get_signing_key_from_jwt(token).key
        payload = decode(
            token,
            signing_key,
            algorithms=["RS256"],
            options={"verify_aud": False}, 
            issuer=ISSUER,
        )


        return payload
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


#to check if user exist or not. validate.
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    token = credentials.credentials
    payload = _verify_token(token)
    return payload

#check user roles 
def require_roles(required_roles: List[str]):
    def role_checker(payload: dict = Depends(get_current_user)):
        roles = []

        realm_access = payload.get("realm_access") or {}
        roles.extend(realm_access.get("roles", []))

        resource_access = payload.get("resource_access", {})
        for client, info in resource_access.items():
            roles.extend(info.get("roles", []))

        if not any(r in roles for r in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient role"
            )

        return payload
    return role_checker
