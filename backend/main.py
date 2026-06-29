from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, documents, session, admin, auth

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(session.router)
app.include_router(admin.router)
app.include_router(auth.router)
