from database import get_conn, release_conn
from psycopg2.extras import RealDictCursor
from models import UserRole
from typing import Optional


def get_users():
    conn = get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT id,username,role,email,created_at FROM users 
            """
        )

        users = cur.fetchall()
        users = [dict(user) for user in users]
        return users

    except Exception as e:
        conn.rollback()
        raise e

    finally:
        if cur:
            cur.close()
        release_conn(conn)


def save_data(username: str, role: UserRole, email: str, password: str):
    conn = get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            INSERT INTO users(username,role,email,password) VALUES (%s,%s,%s,%s) RETURNING id
            """,
            (username, role, email, password),
        )

        res = cur.fetchone()
        res = dict(res)
        conn.commit()
        return res

    except Exception as e:
        conn.rollback()
        raise e

    finally:
        if cur:
            cur.close()
        release_conn(conn)


def delete_data(id: Optional[int] = None, username: Optional[int] = None):
    conn = get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        if not id and not username:
            return {"error": "I need required id or username to delete"}
        if id:
            cur.execute(
                """
            DELETE FROM users WHERE id = %s RETURNING id
            """,
                (id,),
            )
        elif username:
            cur.execute(
                """
            DELETE FROM users WHERE username = %s RETURNING id
            """,
                (username,),
            )
        res = cur.fetchone()
        if not res:
            return {"error": "user not found"}
        conn.commit()
        return dict(res)
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        if cur:
            cur.close()
        release_conn(conn)
