from pydantic import BaseModel
from typing import Optional


class ChatRequest(BaseModel):
    session_id: Optional[int] = None
    text: str


class DocumentRequest(BaseModel):
    text: str
    filename: str
    collection: Optional[str] = None


class DocumentUpdateRequest(BaseModel):
    text: Optional[str] = None
    filename: Optional[str] = None


class AdminChatRequest(BaseModel):
    session_id: Optional[int] = None
    text: str


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[str] = "user"


class UpdateSessionRequest(BaseModel):
    topic: str


class DeleteSessionsRequest(BaseModel):
    session_ids: list[int]


class DocumentSearchRequest(BaseModel):
    text: str


class ProjectCreatedRequest(BaseModel):
    name: str
