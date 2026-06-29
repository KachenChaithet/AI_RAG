from langchain_text_splitters import RecursiveCharacterTextSplitter
from services.embed import generate_embedding
from database import get_conn, release_conn
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import PlainTextResponse
from schemas import DocumentRequest, DocumentUpdateRequest
from psycopg2.extras import RealDictCursor
import pdfplumber
from docx import Document as DocxDocument
import io
from typing import Optional
import time
from utils.dependencies import get_current_user
from urllib.parse import quote
from schemas import DocumentSearchRequest
import json
import ollama
from fastapi.responses import StreamingResponse


router = APIRouter()


def split_text(text: str) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
    )

    return splitter.split_text(text)


def save_data(
    text: str, filename: str, collection: str = "General", type: str = "text"
):
    chunks = split_text(text)
    embed = generate_embedding(chunks)
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO documents  (filename,type,collection)  VALUES (%s,%s,%s) RETURNING id",
            (filename, type, collection),
        )
        doc_id = cur.fetchone()[0]
        for i, chunk in enumerate(chunks):
            cur.execute(
                """
                INSERT INTO chunks (doc_id,content,embedding) VALUES (%s,%s,%s)
                """,
                (doc_id, chunk, embed[i].tolist()),
            )
        conn.commit()
        return doc_id
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        if cur:
            cur.close()
        release_conn(conn)


@router.get("/document")
def get_document(
    search: str = "",
    collection: str = "",
    type: str = "",
    page: int = 1,
    limit: int = 10,
    user=Depends(get_current_user),
):
    if user["role"] != "admin":
        raise HTTPException(403)
    conn = get_conn()
    cur = None

    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        offset = (page - 1) * limit

        query = """
            SELECT d.id, d.filename, d.created_at, d.type, d.collection, 
                COUNT(c.id) as chunk_count,
                SUM(LENGTH(c.content)) as total_chars
            FROM documents d
            LEFT JOIN chunks c ON c.doc_id = d.id
            WHERE 1=1
        """
        params = []

        if search:
            query += " AND d.filename ILIKE %s"
            params.append(f"%{search}%")

        if type:
            query += " AND d.type = %s"
            params.append(type)

        query += " GROUP BY d.id, d.filename, d.created_at, d.type"
        query += " ORDER BY d.created_at DESC"
        query += " LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cur.execute(query, params)
        docs = cur.fetchall()

        # นับ total
        cur.execute("SELECT COUNT(*) as total FROM documents")
        total = cur.fetchone()["total"]

        conn.commit()
        return {"data": docs, "total": total, "page": page, "limit": limit}
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        if cur:
            cur.close()
        release_conn(conn)


@router.post("/document/text")
def upload_document(request: DocumentRequest):
    try:
        filename = request.filename
        if not filename.endswith(".txt"):
            filename = f"{filename}.txt"
        doc_id = save_data(request.text, filename, request.collection)
        if doc_id is None:
            return {"error": "save failed"}
        return {"doc_id": doc_id, "status": "success"}
    except Exception as e:
        return {"error": str(e)}


@router.post("/document/pdf")
async def upload_document_pdf(files: list[UploadFile] = File(...)):
    results = []
    try:
        for file in files:
            content = await file.read()
            file_type = file.filename.split(".")[-1].lower()
            if file.filename.endswith(".pdf"):
                with pdfplumber.open(io.BytesIO(content)) as pdf:
                    text = " ".join([page.extract_text() for page in pdf.pages])

            elif file.filename.endswith(".docx"):
                doc = DocxDocument(io.BytesIO(content))
                text = " ".join([para.text for para in doc.paragraphs if para.text])
            else:
                results.append({"filename": file.filename, "error": "ไม่รองรับไฟล์นี้"})
                continue
            doc_id = save_data(text.replace("\x00", ""), file.filename, type=file_type)
            results.append(
                {"doc_id": doc_id, "filename": file.filename, "status": "success"}
            )
        return results

    except Exception as e:
        return {"error": str(e)}


@router.put("/document/text/{doc_id}")
async def update_document(doc_id: int, request: DocumentUpdateRequest):
    conn = get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        if not request.filename and not request.text:
            return {"error": "plase sent to requirement"}

        cur.execute("SELECT filename FROM documents WHERE id = %s", (doc_id,))

        doc = cur.fetchone()
        if not doc:
            raise HTTPException(404, "Document not found")

        if request.filename and doc:
            original_ext = doc["filename"].rsplit(".", 1)[-1]
            new_filename = f"{request.filename.rsplit('.', 1)[0]}.{original_ext}"

            cur.execute(
                """
            UPDATE documents SET filename = %s WHERE id = %s   RETURNING id              
            """,
                (
                    new_filename,
                    doc_id,
                ),
            )
            res = cur.fetchone()
            if not res:
                return {"error": "document not found"}

        if request.text:
            chunks = split_text(request.text)
            embed = generate_embedding(chunks)
            cur.execute("DELETE FROM chunks WHERE doc_id = %s  RETURNING id", (doc_id,))
            res = cur.fetchone()
            if not res:
                return {"error": "document not found"}
            for i, chunk in enumerate(chunks):
                cur.execute(
                    "INSERT INTO chunks (doc_id,content,embedding) VALUES (%s,%s,%s) RETURNING doc_id",
                    (doc_id, chunk, embed[i].tolist()),
                )

        conn.commit()

        return {"doc_id": doc_id, "status": "success"}
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}
    finally:
        if cur:
            cur.close()
        release_conn(conn)


@router.put("/document/pdf/{doc_id}")
async def update_document_pdf(
    doc_id: int, file: Optional[UploadFile] = File(None), filename: Optional[str] = None
):
    conn = get_conn()
    cur = None
    try:
        cur = conn.cursor()
        if not filename and not file:
            return {"error": "plase sent to requirement"}
        if filename:
            cur.execute(
                """
            UPDATE documents SET filename = %s WHERE id = %s   RETURNING id              
            """,
                (
                    filename,
                    doc_id,
                ),
            )
            res = cur.fetchone()
            if not res:
                return {"error": "document not found"}

        if file:
            content = await file.read()
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                text = " ".join([page.extract_text() for page in pdf.pages])

            chunks = split_text(text)
            embed = generate_embedding(chunks)
            cur.execute("DELETE FROM chunks WHERE doc_id = %s  RETURNING id", (doc_id,))
            res = cur.fetchone()
            if not res:
                return {"error": "document not found"}
            for i, chunk in enumerate(chunks):
                cur.execute(
                    "INSERT INTO chunks (doc_id,content,embedding) VALUES (%s,%s,%s) RETURNING doc_id",
                    (doc_id, chunk, embed[i].tolist()),
                )

        conn.commit()

        return {"doc_id": doc_id, "status": "success"}
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}
    finally:
        if cur:
            cur.close()
        release_conn(conn)


@router.delete("/document/{doc_id}")
async def delete_document(doc_id: int):
    conn = get_conn()
    cur = None
    try:
        cur = conn.cursor()
        cur.execute(
            """
            DELETE FROM documents WHERE id = %s  RETURNING id
                    
            """,
            (doc_id,),
        )
        res = cur.fetchone()
        if not res:
            return {"error": "document not found"}
        conn.commit()
        cur.close()
        return {"doc_id": res[0], "status": "success"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if cur:
            cur.close()
        release_conn(conn)


@router.get("/health/vector-store")
def vector_store_health():
    conn = get_conn()
    cur = None
    start = time.time()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # เช็คว่า pgvector extension มีอยู่จริง
        cur.execute("SELECT extversion FROM pg_extension WHERE extname = 'vector'")
        ext = cur.fetchone()

        if not ext:
            return {"status": "unhealthy", "error": "pgvector extension not found"}

        # ทดสอบ query บน table ที่มี vector column จริง
        cur.execute("SELECT COUNT(*) FROM chunks")

        latency_ms = round((time.time() - start) * 1000, 2)
        return {
            "status": "healthy",
            "latency_ms": latency_ms,
            "pgvector_version": ext["extversion"],
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
    finally:
        if cur:
            cur.close()
        release_conn(conn)


@router.get("/dashboard/stats")
def get_stats(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403)

    conn = get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT 
                COUNT(DISTINCT doc_id) as total_documents,
                COUNT(*) as total_chunks,
                AVG(LENGTH(content)) as avg_chunk_size
            FROM chunks
        """)
        stats = cur.fetchone()
        return stats
    finally:
        if cur:
            cur.close()
        release_conn(conn)


@router.get("/document/{doc_id}/size")
def get_size(doc_id: int, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403)
    conn = get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT d.id, d.filename, d.created_at,
                    COUNT(c.id) as chunk_count,
                    SUM(LENGTH(c.content)) as total_chars
            FROM documents d
            LEFT JOIN chunks c ON c.doc_id = d.id
            WHERE d.id = %s
            GROUP BY d.id, d.filename, d.created_at 
            """,
            (doc_id,),
        )
        size = cur.fetchone()
        return size
    finally:
        if cur:
            cur.close()
        release_conn(conn)


@router.get("/document/{doc_id}/download")
def download_document(doc_id: int, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403)
    conn = get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("SELECT filename FROM documents WHERE id = %s", (doc_id,))

        doc = cur.fetchone()
        if not doc:
            raise HTTPException(404)

        cur.execute(
            "SELECT content FROM chunks WHERE doc_id = %s ORDER BY id ASC", (doc_id,)
        )
        chunks = cur.fetchall()
        full_text = "\n".join([c["content"] for c in chunks])

        return PlainTextResponse(
            content=full_text,
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{quote(doc['filename'])}.txt"
            },
            media_type="text/plain; charset=utf-8",
        )
    except Exception as e:
        conn.rollback()
        return {"status": "unhealthy", "error": str(e)}
    finally:
        if cur:
            cur.close()
        release_conn(conn)


@router.post("/document/search")
def search_document(request: DocumentSearchRequest, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403)
    embed = generate_embedding([request.text])
    conn = get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
        SELECT c.content, d.filename, d.id as doc_id,
               c.embedding <-> %s::vector AS distance
        FROM chunks c
        JOIN documents d ON d.id = c.doc_id
        ORDER BY distance
        LIMIT 5    
        """,
            (embed[0].tolist(),),
        )
        results = cur.fetchall()
        threshold = 4.0
        relevant = [r for r in results if r["distance"] < threshold]

        context = "\n".join([r["content"] for r in relevant]) if relevant else ""
        sources = list({r["filename"] for r in relevant})
        print("relevant count:", len(relevant))
        print("distances:", [(r["filename"], round(r["distance"], 2)) for r in results])
        print("context:", context)

        def generate():
            yield f"data: {json.dumps({'type': 'sources', 'content': sources}, ensure_ascii=False)}\n\n"

            if not relevant:
                yield f"data: {json.dumps({'type': 'content', 'content': 'ไม่พบข้อมูลที่เกี่ยวข้องครับ'}, ensure_ascii=False)}\n\n"
                return

            stream_response = ollama.generate(
                model="scb10x/llama3.1-typhoon2-8b-instruct:latest",
                system="คุณเป็นผู้ช่วยค้นหาข้อมูลจากเอกสาร ตอบเป็นภาษาไทย กระชับ ตรงประเด็น อิงจากข้อมูลที่ให้มาเท่านั้น",
                prompt=f"""
               คุณเป็น AI ที่ตอบคำถามจาก Context
               
                Context
                --------
                {context}

                Question
                --------
                {request.text}

                Answer
                
                กฎ

                - ใช้ข้อมูลจาก Context เป็นหลัก
                - ถ้า Context มีข้อมูลที่เกี่ยวข้อง ให้สรุปจาก Context
                - ไม่ต้องค้นหาว่ามี "เอกสารเฉพาะ" หรือไม่
                - ถ้า Context กล่าวถึงบางส่วน ให้ใช้ข้อมูลนั้นตอบ
                - ตอบว่า "ไม่พบข้อมูลใน Context" เฉพาะเมื่อcontext ไม่มี จริงๆ

                """,
                stream=True,
            )
            for chunk in stream_response:
                content = chunk["response"]
                if content:
                    yield f"data: {json.dumps({'type': 'content', 'content': content}, ensure_ascii=False)}\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")
    except Exception as e:
        if cur:
            cur.close()
        release_conn(conn)
        raise e
    finally:
        if cur:
            cur.close()
        release_conn(conn)
