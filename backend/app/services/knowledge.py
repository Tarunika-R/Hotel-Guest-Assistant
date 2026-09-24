import json
from functools import lru_cache
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "hotel.json"


@lru_cache
def get_hotel() -> dict:
    with open(DATA_PATH, encoding="utf-8") as f:
        return json.load(f)


def get_rooms() -> list[dict]:
    return get_hotel()["rooms"]


def max_capacity() -> int:
    return max(r["capacity"] for r in get_rooms())


def build_context() -> str:
    """Flatten the KB into plain text for the LLM prompt (used in Step 3)."""
    h = get_hotel()
    lines = [f"HOTEL: {h['hotel']['name']}, {h['hotel']['location']}. "
             f"Phone {h['hotel']['phone']}, email {h['hotel']['email']}. "
             f"Prices in {h['hotel']['currency']}."]

    lines.append("\nPOLICIES:")
    lines += [f"- {k.replace('_', ' ').title()}: {v}" for k, v in h["policies"].items()]

    lines.append(f"\nBREAKFAST: Included in rate: {'yes' if h['breakfast']['included'] else 'no'}. "
                 f"{h['breakfast']['details']}")

    lines.append("\nAMENITIES:")
    lines += [f"- {a['name']}: {a['details']}" for a in h["amenities"]]

    lines.append("\nROOMS:")
    for r in h["rooms"]:
        lines.append(f"- {r['name']} (id {r['id']}): sleeps {r['capacity']}, {r['beds']}, "
                     f"{r['size_sqm']} sqm, ${r['price_per_night']}/night, "
                     f"features: {', '.join(r['features'])}")

    lines.append("\nFAQS:")
    lines += [f"- Q: {f['q']} A: {f['a']}" for f in h["faqs"]]
    return "\n".join(lines)