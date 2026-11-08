import json
from pathlib import Path
from typing import Any

from dotenv import load_dotenv


SERVER_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = SERVER_DIR / "data"

load_dotenv(SERVER_DIR / ".env")


def load_json_data(filename: str) -> Any:
    return json.loads((DATA_DIR / filename).read_text(encoding="utf-8"))


RUNTIME_CONFIG = load_json_data("runtime_config.json")
LIBRARY_DATA = load_json_data("Library.json")
SCRIPTURES = load_json_data("scriptures.json")
