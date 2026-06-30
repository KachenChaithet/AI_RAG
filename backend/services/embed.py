from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import os

load_dotenv()

EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL", "paraphrase-multilingual-MiniLM-L12-v2"
)  

model = SentenceTransformer(EMBEDDING_MODEL)


def generate_embedding(data: list[str]):
    result = model.encode(data)
    return result
