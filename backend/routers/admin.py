from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
import ollama
from services.admin import get_users, save_data
from routers.chat import get_history, generate_topic
from database import get_conn, release_conn
from psycopg2.extras import RealDictCursor
from schemas import AdminChatRequest
from typing import Optional
import json
from utils.dependencies import get_current_user


router = APIRouter()

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_users",
            "description": "ใช้เมื่อต้องการดูรายชื่อ user ทั้งหมด",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "save_data",
            "description": "ใช้เมื่อต้องการเพิ่มข้อมูลใหม่ลง DB",
            "parameters": {
                "type": "object",
                "properties": {
                    "username": {"type": "string"},
                    "role": {"type": "string"},
                    "email": {"type": "string"},
                    "password": {"type": "string"},
                },
                "required": ["username", "role", "email", "password"],
            },
        },
    },
    # {
    #     "type": "function",
    #     "function": {
    #         "name": "delete_data",
    #         "description": "ใช้เมื่อต้องการลบ user โดยใช้ id หรือ username อย่างใดอย่างหนึ่ง",
    #         "parameters": {
    #             "type": "object",
    #             "properties": {""},
    #         },
    #     },
    # },
]


NO_CONFIRM_TOOLS = ["get_users"]


def handle_tool_call(pending: dict):
    name = pending["tool_name"]
    args = pending["tool_args"]

    if name == "get_users":
        return get_users()
    elif name == "save_data":
        required = ["username", "role", "email", "password"]
        missing = [f for f in required if f not in args or not args.get(f)]
        if missing:
            return {"error": f"ข้อมูลไม่ครบ: {', '.join(missing)}"}
        return save_data(
            args["username"],
            args["role"],
            args["email"],
            args["password"],
        )
    return None


def admin_chat(
    role: str,
    text: str,
    user_id: int,
    session_id: Optional[int] = None,
):
    conn = get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        last_msg = text.strip().lower()

        def sse_format(content: str, event_type: str = "content") -> str:
            return f"data: {json.dumps({'type': event_type, 'content': content}, ensure_ascii=False)}\n\n"

        def single_response_stream(text: str, sid: int):
            yield sse_format(str(sid), "session_id")  # ✅ ส่ง session_id ก่อนเสมอ
            yield sse_format(text, "content")

        # สร้าง session ถ้ายังไม่มี
        if session_id is None:
            topic = generate_topic(text)
            cur.execute(
                "INSERT INTO session (user_id,topic,type) VALUES (%s,%s,%s) RETURNING id",
                (user_id, topic, role),
            )
            conn.commit()
            res = cur.fetchone()
            if not res:
                return StreamingResponse(
                    single_response_stream("เกิดข้อผิดพลาดในการสร้าง session ครับ", 0),
                    media_type="text/event-stream",
                )
            session_id = res["id"]

        # เช็ค pending tool
        cur.execute(
            "SELECT tool_name, tool_args FROM pending_tools WHERE session_id = %s",
            (session_id,),
        )
        pending = cur.fetchone()

        # confirm if have pending
        if pending:
            cur.execute(
                "INSERT INTO message (session_id,role,text) VALUES (%s,%s,%s)",
                (session_id, "user", text),
            )

            if last_msg in ["ยืนยัน", "ok", "yes", "ใช่"]:
                result = handle_tool_call(pending)
                cur.execute(
                    "DELETE FROM pending_tools WHERE session_id = %s", (session_id,)
                )
                response2 = ollama.chat(
                    model="qwen2.5:7b",
                    messages=[
                        {
                            "role": "system",
                            "content": "คุณเป็น admin assistant ตอบเป็นภาษาไทย กระชับ ลงท้ายด้วย ครับ",
                        },
                        {
                            "role": "user",
                            "content": f"ดำเนินการสำเร็จ ผลลัพธ์: {str(result)}",
                        },
                    ],
                )
                ai_text = response2.message.content
                cur.execute(
                    "INSERT INTO message (session_id,role,text) VALUES (%s,%s,%s)",
                    (session_id, "assistant", ai_text),
                )
                conn.commit()
                return StreamingResponse(
                    single_response_stream(ai_text, session_id),
                    media_type="text/event-stream",
                )

            elif last_msg in ["ยกเลิก", "no", "ไม่", "cancel"]:
                cur.execute(
                    "DELETE FROM pending_tools WHERE session_id = %s", (session_id,)
                )
                ai_text = "ยกเลิกแล้วครับ"
                cur.execute(
                    "INSERT INTO message (session_id,role,text) VALUES (%s,%s,%s)",
                    (session_id, "assistant", ai_text),
                )
                conn.commit()
                return StreamingResponse(
                    single_response_stream(ai_text, session_id),
                    media_type="text/event-stream",
                )

            else:
                ai_text = f"กรุณายืนยันหรือยกเลิกก่อนครับ\n{pending['tool_args']}"
                cur.execute(
                    "INSERT INTO message (session_id,role,text) VALUES (%s,%s,%s)",
                    (session_id, "assistant", ai_text),
                )
                conn.commit()
                return StreamingResponse(
                    single_response_stream(ai_text, session_id),
                    media_type="text/event-stream",
                )

        history = get_history(cur, session_id,6)
       

        system_prompt = """คุณเป็น admin assistant ที่มี tool: get_users, save_data

            ตัวอย่างการใช้ tool:
            user: "ดู user ทั้งหมด" → เรียก get_users
            user: "มี user กี่คน" → เรียก get_users
            user: "เพิ่ม user ใหม่ชื่อ X" → เรียก save_data

            กฎการใช้ history:
            - เมื่อ user ถามถึงข้อมูล user/รายชื่อ/จำนวน user ให้เรียก function get_users เสมอ ไม่ว่าจะเคยเรียกมาก่อนหรือไม่
            - ใช้ข้อมูลจาก history เฉพาะกรณีที่คำถามเป็นคำถามต่อเนื่องจากคำตอบก่อนหน้าทันที (เช่น "อันนั้นมีกี่คน" ต่อจากที่เพิ่งแสดงผลไป)
            - ห้าม generate ข้อมูลตัวอย่างขึ้นมาเองแล้วเรียก function
        """

        # รอบแรก: ไม่ stream เพื่อเช็ค tool_calls
        response = ollama.chat(
            model="qwen2.5:7b",
            messages=[
                {"role": "system", "content": system_prompt},
                *history,
                {"role": "user", "content": text},
            ],
            stream=False,
            tools=tools,
        )

        if response.message.tool_calls:
            tool = response.message.tool_calls[0]
            args = tool.function.arguments
            print(tool)

            if tool.function.name in NO_CONFIRM_TOOLS:
                pending_dict = {"tool_name": tool.function.name, "tool_args": args}
                result = handle_tool_call(pending_dict)

                response2 = ollama.generate(
                    model="qwen2.5:7b",
                    system="คุณเป็น admin assistant ที่มีสิทธิ์เข้าถึงข้อมูลทั้งหมดในระบบ ตอบเป็นภาษาไทย กระชับ ตรงประเด็น",
                    prompt=f"""
                    ข้อมูลจากระบบ จำนวน user ในระบบคือ {len(result)} คน":
                    {json.dumps(result, ensure_ascii=False, default=str)}

                    คำถามจาก admin:
                    {text}

                    ตอบสั้นๆ ตรงประเด็น
                    """,
                    options={"temperature": 0},
                )
                ai_text = response2["response"]

                cur.execute(
                    "INSERT INTO message (session_id,role,text) VALUES (%s,%s,%s)",
                    (session_id, "user", text),
                )
                cur.execute(
                    "INSERT INTO message (session_id,role,text) VALUES (%s,%s,%s)",
                    (
                        session_id,
                        "assistant",
                        f"[ข้อมูล: {json.dumps(result, ensure_ascii=False, default=str)}]\n{ai_text}",
                    ),
                )
                conn.commit()
                return StreamingResponse(
                    single_response_stream(ai_text, session_id),
                    media_type="text/event-stream",
                )

            else:
                # validate args ก่อนเก็บลง pending
                if tool.function.name == "save_data":
                    required = ["username", "role", "email", "password"]
                    missing = [f for f in required if f not in args or not args.get(f)]
                    if missing:
                        ai_text = f"ข้อมูลไม่ครบครับ กรุณาระบุ: {', '.join(missing)}"
                        cur.execute(
                            "INSERT INTO message (session_id,role,text) VALUES (%s,%s,%s)",
                            (session_id, "assistant", ai_text),
                        )
                        conn.commit()
                        return StreamingResponse(
                            single_response_stream(ai_text, session_id),
                            media_type="text/event-stream",
                        )

                cur.execute(
                    "INSERT INTO message (session_id,role,text) VALUES (%s,%s,%s)",
                    (session_id, "user", text),
                )
                cur.execute(
                    """
                                    INSERT INTO pending_tools (session_id, tool_name, tool_args) 
                                    VALUES (%s, %s, %s)
                                    ON CONFLICT (session_id) DO UPDATE 
                                    SET tool_name = %s, tool_args = %s
                                    """,
                    (
                        session_id,
                        tool.function.name,
                        json.dumps(args),
                        tool.function.name,
                        json.dumps(args),
                    ),
                )
                ai_text = f"ยืนยันดำเนินการไหมครับ?\n{args}"
                cur.execute(
                    "INSERT INTO message (session_id,role,text) VALUES (%s,%s,%s)",
                    (session_id, "assistant", ai_text),
                )
                conn.commit()
                return StreamingResponse(
                    single_response_stream(ai_text, session_id),
                    media_type="text/event-stream",
                )

        # ===== ไม่มี tool_calls → save user message + stream คำตอบ =====
        cur.execute(
            "INSERT INTO message (session_id,role,text) VALUES (%s,%s,%s)",
            (session_id, "user", text),
        )
        conn.commit()
        print("no response tool")
        #  รอบสอง: stream จริง
        stream_response = ollama.chat(
            model="qwen2.5:7b",
            messages=[
                {"role": "system", "content": system_prompt},
                *history,
                {"role": "user", "content": text},
            ],
            stream=True,
        )

        def generate():
            yield sse_format(str(session_id), "session_id")  # ✅ ส่งก่อนเสมอ
            full_response = ""
            for chunk in stream_response:
                content = chunk["message"]["content"]
                full_response += content
                yield sse_format(content, "content")

            save_conn = get_conn()
            save_cur = None
            try:
                save_cur = save_conn.cursor()
                save_cur.execute(
                    "INSERT INTO message (session_id,role,text) VALUES (%s,%s,%s)",
                    (session_id, "assistant", full_response),
                )
                save_conn.commit()
            except Exception as e:
                save_conn.rollback()
                print("save error:", e)
            finally:
                if save_cur:
                    save_cur.close()
                release_conn(save_conn)

        return StreamingResponse(generate(), media_type="text/event-stream")

    except Exception as e:
        conn.rollback()
        raise e
    finally:
        if cur:
            cur.close()
        release_conn(conn)


@router.post("/admin/chat")
def admin_chat_endpoint(request: AdminChatRequest, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(
            status_code=403, detail="You do not have permission to access this site."
        )
    return admin_chat(user["role"], request.text, user["user_id"], request.session_id)
