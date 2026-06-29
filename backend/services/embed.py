from sentence_transformers import SentenceTransformer

model = SentenceTransformer(
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)


def generate_embedding(data: list[str]):
    result = model.encode(data)
    return result
