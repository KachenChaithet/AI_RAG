from fastapi import APIRouter, HTTPException, Response, Request
from database import get_conn, release_conn
from psycopg2.extras import RealDictCursor
from schemas import LoginRequest, RegisterRequest
import bcrypt
from utils.jwt import create_token, verify_token


router = APIRouter()


@router.post("/login")
def login(body: LoginRequest, response: Response):
    conn = get_conn()
    cur = None

    if not body.email and not body.password:
        return {"error": "We need required"}
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM users WHERE email = %s", (body.email,))
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="not found")
        if not bcrypt.checkpw(body.password.encode(), user["password"].encode()):
            raise HTTPException(status_code=401, detail="password not correct")
        token = create_token({"user_id": user["id"], "role": user["role"]})
        response.set_cookie(
            key="token",
            value=token,
            httponly=True,
            samesite="lax",
            secure=False,  # ← ต้องเป็น False ตอน dev (http ไม่ใช่ https)
        )
        return {"message": "login success"}
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        if cur:
            cur.close()
        release_conn(conn)


@router.post("/register")
def register(body: RegisterRequest, response: Response):
    conn = get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute(
            """
            SELECT id FROM users WHERE email = %s 
            """,
            (body.email,),
        )

        if cur.fetchone():
            raise HTTPException(status_code=400, detail="user is have already")

        hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()

        cur.execute(
            "INSERT INTO users (username,email,password,role) VALUES  (%s,%s,%s,%s) RETURNING id",
            (body.username, body.email, hashed, body.role),
        )

        user = cur.fetchone()
        conn.commit()

        token = create_token({"user_id": user["id"], "role": body.role})
        response.set_cookie(
            key="token",
            value=token,
            httponly=True,
            samesite="lax",
            secure=False,  # ← ต้องเป็น False ตอน dev (http ไม่ใช่ https)
            # secure=True
        )
        return {"message": "register success"}
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        if cur:
            cur.close()
        release_conn(conn)


@router.get("/verify")
def verify(request: Request):
    token = request.cookies.get("token")

    if not token:
        raise HTTPException(status_code=401)

    payload = verify_token(token)

    if not payload:
        raise HTTPException(status_code=401)

    return payload


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("token")
    return {"message": "logout success"}
