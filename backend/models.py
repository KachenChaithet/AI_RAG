from pydantic import BaseModel
from enum import Enum
from datetime import datetime


class UserRole(str, Enum):
    user = "user"
    admin = "admin"


class User(BaseModel):
    id: int
    username: str
    role: UserRole
    email: str
    password: str
    created_at: datetime


class Session(BaseModel):
    id: int
    user_id: int
    topic: str
    created_at: datetime


class MessageRole(str, Enum):
    user = "user"
    assistant = "assistant"


class Message(BaseModel):
    id: int
    session_id: int  
    role: MessageRole
    text: str
    created_at: datetime


class Documents(BaseModel):
    id: int
    filname: str
    created_at: datetime


class Chunks(BaseModel):
    id: int
    doc_id: int  
    content: str
    embedding: list[float]

