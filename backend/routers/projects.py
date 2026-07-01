from fastapi import APIRouter, Depends
from psycopg2.extras import RealDictCursor
from utils.dependencies import get_current_user
from schemas import ProjectCreatedRequest
from database import get_conn, release_conn

router = APIRouter()


@router.get("/project")
def get_projects(user=Depends(get_current_user)):
    conn = get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute(
            """
            SELECT id, user_id, name, created_at
            FROM project
            WHERE user_id = %s
            """,
            (user["user_id"],),
        )

        projects = cur.fetchall()

        return projects
    except Exception as e:
        return {"error": str(e)}
    finally:
        if cur:
            cur.close()
        release_conn(conn)
