# analysis/main.py
import os
import datetime
import time
import math
from typing import Optional, Any
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

# Google GenAI SDK
try:
    from google import genai
except Exception as e:
    genai = None

load_dotenv()  # load analysis/.env if present

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY or GOOGLE_API_KEY is not set. Add it to analysis/.env or environment")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/iot_lab")
MONGO_DBNAME = os.getenv("MONGO_DBNAME", "iot_lab")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")  # change if your account uses a different model
CACHE_TTL_SECONDS = int(os.getenv("ANALYSIS_CACHE_TTL", str(60 * 10)))  # 10 minutes default

# Connect to MongoDB
mongo_client = MongoClient(MONGO_URI)
db = mongo_client[MONGO_DBNAME]

# FastAPI app + CORS
app = FastAPI(title="IoT Lab — Gemini Analysis Service")
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # set to ["*"] for development if needed
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize GenAI client if available
if genai is None:
    # Delay raising until runtime usage - but warn now
    print("Warning: google-genai SDK not installed or failed to import. Install with `pip install google-genai`.")
else:
    genai_client = genai.Client(api_key=GEMINI_API_KEY)

# Simple TTL cache (in-memory)
_cache = {"timestamp": 0.0, "data": None}


# ---------- Pydantic request model ----------
class AnalysisRequest(BaseModel):
    days: int = 30
    top_n: int = 8
    low_stock_threshold: int = 5
    force_refresh: Optional[bool] = False


# ---------- Mongo aggregation helpers ----------
def _get_top_borrowed(days: int, limit: int):
    since = datetime.datetime.utcnow() - datetime.timedelta(days=days)
    pipeline = [
        {"$match": {"type": "borrow", "timestamp": {"$gte": since}}},
        {"$group": {"_id": "$item_id", "totalQty": {"$sum": "$qty"}}},
        {"$sort": {"totalQty": -1}},
        {"$limit": limit},
        {"$lookup": {"from": "items", "localField": "_id", "foreignField": "_id", "as": "item"}},
        {"$unwind": {"path": "$item", "preserveNullAndEmptyArrays": True}},
        {"$project": {
            "sku": "$item.sku",
            "name": "$item.name",
            "totalQty": 1,
            "available_quantity": "$item.available_quantity",
            "total_quantity": "$item.total_quantity"
        }}
    ]
    return list(db.events.aggregate(pipeline))


def _get_low_stock(threshold: int):
    cursor = db.items.find(
        {"available_quantity": {"$lte": threshold}},
        {"sku": 1, "name": 1, "available_quantity": 1, "total_quantity": 1}
    ).sort([("available_quantity", 1)]).limit(200)
    return list(cursor)


# ---------- JSON-safe serialization helpers ----------
def _serialize_value(v: Any):
    """Serialize values returned from Mongo so they are JSON-safe."""
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, dict):
        return _serialize_doc(v)
    if isinstance(v, list):
        return [_serialize_value(x) for x in v]
    # primitives (int/float/str/bool/None) are fine
    return v


def _serialize_doc(doc: dict):
    """Recursively convert a Mongo document (dict-like) into JSON-safe dict."""
    if not isinstance(doc, dict):
        return _serialize_value(doc)
    out = {}
    for k, v in doc.items():
        out[k] = _serialize_value(v)
    return out


def _serialize_list(docs: list):
    """Serialize a list of documents or values."""
    return [_serialize_doc(d) if isinstance(d, dict) else _serialize_value(d) for d in docs]


# ---------- Prompt builder ----------
def _build_prompt(top_borrowed, low_stock, days: int):
    lines = [
        "You are an experienced inventory analyst. Given the data below, produce three sections:",
        "1) A 2-3 sentence summary describing demand patterns over the specified period.",
        "2) Top 5 items to consider restocking. For each list a recommended reorder quantity and a short reason. Try to show simple math where possible.",
        "3) Suggested low-stock thresholds for the most-used items (short list).",
        "",
        "Provide the answer in plain text. Keep recommendations actionable.",
        "",
        f"Data: (last {days} days)",
        "TopBorrowed:"
    ]
    for t in top_borrowed:
        lines.append(
            f"- sku: {t.get('sku')}, name: {t.get('name')}, borrowed_qty: {t.get('totalQty')}, "
            f"available: {t.get('available_quantity')}, total_owned: {t.get('total_quantity')}"
        )
    lines.append("")
    lines.append("LowStock:")
    for l in low_stock:
        lines.append(
            f"- sku: {l.get('sku')}, name: {l.get('name')}, available: {l.get('available_quantity')}, total_owned: {l.get('total_quantity')}"
        )
    lines.append("")
    lines.append("Return a concise, actionable response.")
    return "\n".join(lines)


# ---------- Gemini (GenAI) call wrapper ----------
def _call_gemini(prompt: str):
    """
    Call Gemini via google-genai SDK.
    Returns:
      - {"text": "..."} on success
      - {"error": "api_error", "detail": "..."} on failure
    """
    if genai is None:
        return {"error": "sdk_missing", "detail": "google-genai SDK not installed."}

    try:
        # Use the client to generate content. API surfaces can evolve; this uses a safe pattern from examples.
        response = genai_client.models.generate_content(model=GEMINI_MODEL, contents=prompt)

        # Attempt to extract textual output
        try:
            text_out = response.text
        except Exception:
            text_out = str(response)

        return {"text": text_out}
    except Exception as e:
        # Return structured error info for caller to decide fallback
        return {"error": "api_error", "detail": str(e)}


# ---------- Simple heuristic fallback recommender ----------
def _simple_restock_recommendations(top_borrowed, low_stock):
    recs = []
    for t in top_borrowed:
        borrowed = int(t.get("totalQty") or 0)
        available = int(t.get("available_quantity") or 0)
        total_owned = int(t.get("total_quantity") or 0)

        desired = math.ceil(borrowed * 0.30)
        needed = max(desired - available, 0)

        min_reorder = 3
        if available <= 2 and total_owned >= min_reorder:
            needed = max(needed, min_reorder)

        reason = f"Recent borrowed {borrowed}. Available {available}. Suggest reorder {needed} to cover ~30% of recent demand."
        recs.append({
            "sku": t.get("sku"),
            "name": t.get("name"),
            "borrowed_qty": borrowed,
            "available": available,
            "total_owned": total_owned,
            "recommended_reorder": needed,
            "reason": reason
        })
    low_alerts = [{"sku": i.get("sku"), "name": i.get("name"), "available": i.get("available_quantity"), "total_owned": i.get("total_quantity")} for i in low_stock]
    return {"recommendations": recs, "low_alerts": low_alerts}


# ---------- Endpoint ----------
@app.post("/analysis/gemini-summary")
def gemini_summary(req: AnalysisRequest):
    now = time.time()
    # Serve from cache unless force_refresh requested
    if not req.force_refresh and _cache["data"] and (now - _cache["timestamp"] < CACHE_TTL_SECONDS):
        cached = _cache["data"]
        return {
            "cached": True,
            "llm_available": cached.get("llm_available", False),
            "llm_response": cached.get("llm_response"),
            "fallback": cached.get("fallback"),
            "top": _serialize_list(cached.get("top", [])),
            "low": _serialize_list(cached.get("low", [])),
            "generated_at": cached.get("generated_at")
        }

    # Run aggregations
    top = _get_top_borrowed(req.days, req.top_n)
    low = _get_low_stock(req.low_stock_threshold)
    prompt = _build_prompt(top, low, req.days)

    # Call Gemini
    gemini_res = _call_gemini(prompt)

    # If SDK missing or API error -> fallback
    if isinstance(gemini_res, dict) and gemini_res.get("error"):
        fallback = _simple_restock_recommendations(top, low)
        msg = ""
        if gemini_res.get("error") == "sdk_missing":
            msg = "Gemini SDK not installed; returning fallback recommendations."
        else:
            msg = f"Gemini API error: {gemini_res.get('detail')}. Returning fallback recommendations."

        result = {
            "llm_available": False,
            "llm_response": msg,
            "api_error_detail": gemini_res.get("detail"),
            "fallback": fallback,
            "top": _serialize_list(top),
            "low": _serialize_list(low),
            "generated_at": datetime.datetime.utcnow().isoformat()
        }
        # Cache and return
        _cache["data"] = result
        _cache["timestamp"] = now
        return {"cached": False, **result}

    # Success path: gemini_res contains 'text'
    llm_text = gemini_res.get("text", "") if isinstance(gemini_res, dict) else str(gemini_res)
    result = {
        "llm_available": True,
        "llm_response": llm_text,
        "top": _serialize_list(top),
        "low": _serialize_list(low),
        "generated_at": datetime.datetime.utcnow().isoformat()
    }

    # Cache and return
    _cache["data"] = result
    _cache["timestamp"] = now
    return {"cached": False, **result}

# ---------------- add to analysis/main.py ----------------
from datetime import timedelta

def _get_usage_over_time(days: int):
    """
    Returns list of daily borrow counts for the last `days` days (including today).
    Output: [{ "date": "2025-12-12", "total": 3 }, ...] ordered ascending by date.
    """
    # compute start day at 00:00 UTC
    now = datetime.datetime.utcnow()
    start = (now - timedelta(days=days-1)).replace(hour=0, minute=0, second=0, microsecond=0)

    pipeline = [
        {"$match": {"type": "borrow", "timestamp": {"$gte": start}}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}
                },
                "total": {"$sum": "$qty"}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    rows = list(db.events.aggregate(pipeline))
    # convert to full timeseries including days with zero
    # build dict from rows
    map_by_date = {r["_id"]: r["total"] for r in rows}
    series = []
    for i in range(days):
        d = (start + timedelta(days=i)).date().isoformat()
        series.append({"date": d, "total": int(map_by_date.get(d, 0))})
    return series

@app.get("/analysis/usage")
def usage_endpoint(days: int = 30):
    """
    GET /analysis/usage?days=30
    returns {"data": [{date, total}, ...]}
    """
    try:
        days = int(days)
        if days < 1 or days > 365:
            raise ValueError("days out of range")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid 'days' parameter")
    series = _get_usage_over_time(days)
    return {"data": series}
# ---------------- end add ----------------

