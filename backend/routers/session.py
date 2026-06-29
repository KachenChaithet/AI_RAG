from fastapi import APIRouter, Depends, HTTPException
from database import get_conn, release_conn
from psycopg2.extras import RealDictCursor
from utils.dependencies import get_current_user
from schemas import UpdateSessionRequest, DeleteSessionsRequest
from typing import Literal

router = APIRouter()


@router.get(
    "/session/user",
)
def get_sessions(
    type: Literal["user", "admin"] = "user",
    limit: int = 20,
    offset: int = 0,
    search: str | None = None,
    user=Depends(get_current_user),
):
    if type == "admin" and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="forbidden")
    conn = get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        pattern = (
            f"%{search.strip()}%" if search and search.strip() else None
        )  # ถ้า มี search เอา search ไปทำ ให้ไม่มี space แล้วเป็น format %search% ถ้าไม่ให้ pattern = None
        cur.execute(
            """
            SELECT id, user_id, topic, created_at
            FROM session
            WHERE user_id = %s
            AND type = %s
            AND (%s IS NULL OR topic ILIKE %s)
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
            """,
            (
                user["user_id"],
                type,
                pattern,
                pattern,
                limit,
                offset,
            ),
        )

        return cur.fetchall()

    except Exception as e:
        conn.rollback()
        return {"error": str(e)}

    finally:
        if cur:
            cur.close()

        release_conn(conn)


@router.get("/session/{session_id}")
def get_session(session_id: int, user=Depends(get_current_user)):
    conn = get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
        SELECT id,user_id,topic,created_at
        FROM session
        WHERE id = %s AND user_id = %s
        """,
            (session_id, user["user_id"]),
        )
        session = cur.fetchone()
        if not session:
            return {"error": "session not found"}
        return session
    except Exception as e:
        return {"error": str(e)}
    finally:
        if cur:
            cur.close()
        release_conn(conn)


@router.get("/session/{session_id}/message")
def get_session_message(session_id: int, user=Depends(get_current_user)):
    conn = get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
           SELECT
            m.id,
            m.role,
            m.text,
            m.created_at
            FROM message m
            JOIN session s
            ON s.id = m.session_id
            WHERE m.session_id = %s
            AND s.user_id = %s
            ORDER BY m.id ASC
            """,
            (session_id, user["user_id"]),
        )

        messages = cur.fetchall()
        if not messages:
            return {"error": "session not found or no messages"}
        return messages

    except Exception as e:
        conn.rollback()
        return {"error": str(e)}
    finally:
        if cur:
            cur.close()
        release_conn(conn)


@router.put("/session/{session_id}")
def update_session(
    session_id: int, body: UpdateSessionRequest, user=Depends(get_current_user)
):
    conn = get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
        UPDATE session SET topic = %s
        WHERE id = %s AND user_id= %s
        RETURNING id
        """,
            (body.topic, session_id, user["user_id"]),
        )
        res = cur.fetchone()
        if not res:
            return {"error": "session not found"}
        conn.commit()
        return {"session_id": session_id, "status": "success"}
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}
    finally:
        if cur:
            cur.close()
        release_conn(conn)


@router.delete("/session/{session_id}")
def delete_session(session_id: int):
    conn = get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            DELETE FROM session WHERE id = %s  RETURNING id
            """,
            (session_id,),
        )
        res = cur.fetchone()
        if not res:
            return {"error": "session not found "}

        conn.commit()

        return {"session_id": res, "status": "success"}
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}
    finally:
        if cur:
            cur.close()
        release_conn(conn)


@router.delete("/session")
def delete_sessions(body: DeleteSessionsRequest, user=Depends(get_current_user)):
    conn = get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            DELETE FROM session 
            WHERE id = ANY(%s) AND user_id = %s
            RETURNING id
            """,
            (body.session_ids, user["user_id"]),
        )
        deleted = cur.fetchall()
        conn.commit()
        return {"deleted": [r["id"] for r in deleted], "status": "success"}
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}
    finally:
        if cur:
            cur.close()
        release_conn(conn)
