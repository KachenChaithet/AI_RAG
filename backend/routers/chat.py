import ollama
from services.rag import query_quest
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from schemas import ChatRequest
from dotenv import load_dotenv
from tavily import TavilyClient
from database import get_conn, release_conn
from psycopg2.extensions import cursor
from psycopg2.extras import RealDictCursor
from utils.dependencies import get_current_user
import re
import os
import json


load_dotenv()

router = APIRouter()


def fix_markdown(text: str):
    # 1. force newline before headers
    text = re.sub(r"(#{2,3})\s*", r"\n\n\1 ", text)

    # 2. force newline before bullet
    text = re.sub(r"(?<!\n)\s*-\s+", r"\n- ", text)

    # 3. force newline before numbered list
    text = re.sub(r"(?<!\n)(\d+\.\s)", r"\n\1", text)

    # 4. fix accidental multiple headers in same line
    text = re.sub(r"(#{2,3}.*?)\s*(#{2,3})", r"\1\n\n\2", text)

    # 5. normalize whitespace
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def chat_ollama(text: str, history: list | None = None):
    history = history or []
    data = query_quest(text)
    print("this is data have:", data)

    if not data:
        check = ollama.generate(
            model="qwen2.5:7b",
            prompt=f"""คำถาม: {text}
            คำถามนี้ต้องการข้อมูล real-time จาก internet ไหม?
            - YES = ต้องการข้อมูลปัจจุบัน เช่น ข่าว, ราคา, สภาพอากาศ
            - NO = คำถามทั่วไป, ทักทาย, คณิตศาสตร์
            ตอบแค่ YES หรือ NO:""",
            options={"temperature": 0},
        )
        answer = check["response"].strip().upper()
        print("check answer:", answer)
        if answer == "YES":
            client = TavilyClient(api_key=os.getenv("TAVILYAPI"))
            results = client.search(text, max_results=3, search_depth="advanced")
            data = "\n".join([r["content"] for r in results["results"]])
    messages = [
        {
            "role": "system",
            "content": f"""คุณเป็นผู้ช่วยตอบคำถามเกี่ยวกับสาขาวิชา ตอบเป็นภาษาไทย กระชับ ลงท้ายด้วย ครับ
            
            ข้อมูลอ้างอิง:
            {data if data else "ไม่มีข้อมูล"}
            
            กฎการตอบ:
            - ถ้ามีข้อมูลอ้างอิง → ใช้ข้อมูลนั้นตอบเท่านั้น ห้ามเดาหรือตอบจากความรู้ตัวเอง
            - ถ้าไม่มีข้อมูลอ้างอิง → ดูจาก history ถ้าถามเรื่องบทสนทนา หรือบอกว่าไม่ทราบ
            - ถ้าข้อมูลไม่ชัดเจน → บอกว่าไม่พบข้อมูลครับ
            - ตอบเป็น Markdown ขึ้นบรรทัดใหม่ทุกหัวข้อและรายการ
            - ห้ามคิดคำขึ้นมาเองอิงจาก ข้อมูลอ้างอิง
            - แจ้งรายละเอียดจาก data ให้ครบถ้วน
            - ตอบตาม ข้อมูลอ้างอิง เท่านั้น

           """,
        },
        *history,
        {"role": "user", "content": text},
    ]
    response = ollama.chat(
        model="gemma4:e4b", stream=True, messages=messages, options={"temperature": 0.1}
    )

    for chunk in response:
        content = chunk["message"]["content"]
        if content:
            yield content


def generate_topic(text: str) -> str:
    response = ollama.chat(
        model="scb10x/llama3.1-typhoon2-8b-instruct",
        messages=[
            {
                "role": "user",
                "content": f"สรุปหัวข้อจากประโยคนี้ให้สั้นและกระชับอันแล้วเข้าใจเลย: {text}",
            }
        ],
    )
    return response["message"]["content"]


def get_history(cur: cursor, session_id: int, limit=10) -> list:
    cur.execute(
        """
        SELECT role, text
        FROM message
        WHERE session_id = %s
        ORDER BY id DESC
        LIMIT %s
        """,
        (session_id, limit),
    )

    rows = cur.fetchall()
    rows.reverse()

    return [{"role": row["role"], "content": row["text"]} for row in rows]


@router.post("/chat")
def chat(request: ChatRequest, user=Depends(get_current_user)):
    conn = get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        session_id = request.session_id

        if session_id is None:
            topic = generate_topic(request.text)

            cur.execute(
                """ 
                INSERT INTO session (user_id,topic) VALUES (%s,%s) RETURNING id
                """,
                (
                    user["user_id"],
                    topic,
                ),
            )

            res = cur.fetchone()
            if not res:
                return {"error": "session error"}
            session_id = res["id"]

        history = get_history(cur, session_id)

        cur.execute(
            """
            INSERT INTO message (session_id,role,text) VALUES (%s,%s,%s) 
            """,
            (
                session_id,
                "user",
                request.text,
            ),
        )
        conn.commit()

        def sse_format(content: str, event_type: str = "content") -> str:
            return f"data: {json.dumps({'type': event_type, 'content': content}, ensure_ascii=False)}\n\n"

        def generate():
            yield sse_format(str(session_id), "session_id")
            full_response = ""

            for chunk in chat_ollama(request.text, history):
                full_response += chunk
                yield sse_format(chunk, "content")

            print("FULL RESPONSE =", full_response)

            conn2 = get_conn()
            cur2 = None

            try:
                cur2 = conn2.cursor(cursor_factory=RealDictCursor)

                cur2.execute(
                    """
                    INSERT INTO message (session_id, role, text)
                    VALUES (%s, %s, %s)
                    """,
                    (
                        session_id,
                        "assistant",
                        full_response,
                    ),
                )
                conn2.commit()
            except Exception as e:
                conn2.rollback()
                print(e)
            finally:
                if cur2:
                    cur2.close()
                release_conn(conn2)

        return StreamingResponse(generate(), media_type="text/event-stream")
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}
    finally:
        if cur:
            cur.close()
        release_conn(conn)
