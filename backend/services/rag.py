from services.embed import generate_embedding
from database import get_conn, release_conn


def query_quest(text: str):
    embed = generate_embedding([text])
    conn = get_conn()
    try:
        cur = conn.cursor()

        cur.execute(
            """
                    SELECT content,embedding <-> %s::vector AS distance
                    FROM chunks
                    ORDER BY embedding <-> %s::vector
                    LIMIT 2
                    """,
            (embed[0].tolist(), embed[0].tolist()),
        )

        response = cur.fetchall()
        print(response)
        threshold = 4.0

        context = "\n".join([row[0] for row in response if row[1] < threshold])
        print("นี้คือ data ที่ได้มา:",context)

        return context
    except Exception as e:
        raise e
    finally:
        release_conn(conn)
