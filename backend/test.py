import re
import json
import ollama
from pydantic import BaseModel


MODEL_NAME = "scb10x/llama3.1-typhoon2-8b-instruct"

ALLOWED_ACTIONS = {
    "increase_score",
    "decrease_score"
}


class ScoreData(BaseModel):
    firstname: str
    lastname: str
    point: int


def normalize_text(text: str) -> str:

    replacements = {
        "นามสนุุล": "นามสกุล",
        "พ้อย": "point"
    }

    text = text.strip()

    for old, new in replacements.items():
        text = text.replace(old, new)

    return text


def classify_intent(text: str) -> str:

    response = ollama.chat(
        model=MODEL_NAME,
        format="json",
        messages=[
            {
                "role": "system",
                "content": """
ตอบ JSON เท่านั้น

schema:
{
  "action": "increase_score"
}

allowed actions:
- increase_score
- decrease_score

ห้ามตอบ field อื่น
"""
            },
            {
                "role": "user",
                "content": text
            }
        ]
    )

    try:
        data = json.loads(response.message.content)

    except json.JSONDecodeError:
        raise ValueError("invalid json from model")

    action = data.get("action")

    if action not in ALLOWED_ACTIONS:
        raise ValueError("invalid action")

    return action


def extract_name(text: str):

    patterns = [

        # นายโดรา นามสกุลเรม่อน
        r"นาย\s*([ก-๙A-Za-z]+)\s*นามสกุล\s*([ก-๙A-Za-z]+)",

        # นายคเชนทร์ ชัยเทศ
        r"นาย\s*([ก-๙A-Za-z]+)\s+([ก-๙A-Za-z]+)"
    ]

    for pattern in patterns:

        match = re.search(pattern, text)

        if match:
            return (
                match.group(1).strip(),
                match.group(2).strip()
            )

    raise ValueError("name not found")


def extract_point(text: str):

    match = re.search(
        r"(?:คะแนน|point|แต้ม)\s*(\d+)",
        text,
        re.IGNORECASE
    )

    if not match:
        raise ValueError("point not found")

    return int(match.group(1))


def extract_score_data(text: str) -> ScoreData:

    firstname, lastname = extract_name(text)

    point = extract_point(text)

    return ScoreData(
        firstname=firstname,
        lastname=lastname,
        point=point
    )


def save_score(data: ScoreData):

    print("SAVE DB =>", data.model_dump())


def main():

    text = "เพิ่มคะแนนของ นายโดรา เอม่อน point67"

    # 1. normalize
    normalized_text = normalize_text(text)

    # 2. classify intent
    action = classify_intent(normalized_text)

    # 3. extract data
    data = extract_score_data(normalized_text)

    # 4. business logic
    if action == "increase_score":
        save_score(data)

    result = {
        "action": action,
        "data": data.model_dump()
    }

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()