from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, documents, session, admin, auth, projects
from dotenv import load_dotenv
import os

load_dotenv()


app = FastAPI()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(session.router)
app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(projects.router)
