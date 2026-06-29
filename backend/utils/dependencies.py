from fastapi import Cookie, HTTPException
from utils.jwt import verify_token


def get_current_user(token: str = Cookie(default=None)):
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="The token was incorrent")

    return payload
