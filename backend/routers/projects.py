from fastapi import APIRouter, Depends
from psycopg2.extras import RealDictCursor
from utils.dependencies import get_current_user
from schemas import ProjectCreatedRequest, ProjectUpdatedRequest
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


@router.post("/project")
def created_project(body: ProjectCreatedRequest, user=Depends(get_current_user)):
    if not body.name.strip():
        return {"error": "name is required"}
    conn = get_conn()
    cur = None

    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
              INSERT INTO project (user_id, name)
              VALUES (%s, %s)
              RETURNING id
            """,
            (
                user["user_id"],
                body.name,
            ),
        )
        res = cur.fetchone()
        conn.commit()
        return {"project_id": res["id"], "status": "success"}
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}
    finally:
        if cur:
            cur.close()
        release_conn(conn)


@router.put("/project/{project_id}")
def update_project(body: ProjectUpdatedRequest, user=Depends(get_current_user)):
    conn = get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            UPDATE project
            """
        )
        return
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}
    finally:
        if cur:
            cur.close()
        release_conn(conn)
