# pipeline.py
"""
Minimal Flask server for heart-disease pipeline.

- POST /predict         -> JSON single-row predict & save to MongoDB
- POST /predict-file    -> multipart file upload (CSV/XLSX), predict each row & save to MongoDB
- GET  /records         -> list recent records (for quick verification)

Requirements:
  pip install flask pandas pymongo python-dotenv
Make sure pipeline.pkl and pipeline_metadata.pkl are in same folder.
Start MongoDB (or provide MONGO_URI env var) before running this script so records are saved.
"""

import os
import uuid
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import pandas as pd
import pickle
import logging

# optional: load env vars from .env
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

# -------------------------
# Config
# -------------------------
ROOT = os.getcwd()
UPLOAD_DIR = os.path.join(ROOT, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

PIPELINE_PATH = os.path.join(ROOT, "pipeline.pkl")
METADATA_PATH = os.path.join(ROOT, "pipeline_metadata.pkl")

ALLOWED_EXT = {".csv", ".xls", ".xlsx"}

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DBNAME = os.getenv("MONGO_DBNAME", "heart_app")

# -------------------------
# Logging
# -------------------------
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("pipeline")

# -------------------------
# Load model pipeline + metadata
# -------------------------
if not os.path.exists(PIPELINE_PATH):
    raise FileNotFoundError(f"pipeline.pkl not found at {PIPELINE_PATH}. Run training script first.")

with open(PIPELINE_PATH, "rb") as f:
    PIPELINE = pickle.load(f)
log.info("Loaded pipeline from %s", PIPELINE_PATH)

if not os.path.exists(METADATA_PATH):
    raise FileNotFoundError(f"pipeline_metadata.pkl not found at {METADATA_PATH}. Run training script first.")

with open(METADATA_PATH, "rb") as f:
    META = pickle.load(f)
FEATURE_ORDER = META.get("feature_columns")
BEST_MODEL = META.get("best_model_name", "model")
log.info("Loaded metadata. Model: %s, Features: %s", BEST_MODEL, FEATURE_ORDER)

# -------------------------
# MongoDB connection
# -------------------------
try:
    from pymongo import MongoClient
    from bson.objectid import ObjectId
except Exception as e:
    raise ImportError("pymongo not installed. Run: pip install pymongo") from e

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
# test connection (will raise if cannot connect)
try:
    client.server_info()
except Exception as e:
    raise ConnectionError(f"Cannot connect to MongoDB at {MONGO_URI}: {e}")

db = client.get_database(MONGO_DBNAME)
records_coll = db.predictions
log.info("Connected to MongoDB at %s, DB: %s", MONGO_URI, MONGO_DBNAME)

# -------------------------
# Flask app
# -------------------------
app = Flask("pipeline")
CORS(app)
def allowed_ext(filename):
    return os.path.splitext(filename.lower())[1] in ALLOWED_EXT

def save_record_to_mongo(record: dict):
    """Insert record dict into MongoDB and return string id."""
    res = records_coll.insert_one(record)
    return str(res.inserted_id)

# -------------------------
# Helpers
# -------------------------
def build_input_df_from_json(data: dict):
    """Return pandas DataFrame with columns in FEATURE_ORDER (single row)."""
    missing = [c for c in FEATURE_ORDER if c not in data]
    if missing:
        return None, {"error": "missing_features", "missing": missing}
    # order columns exactly
    row = [data[c] for c in FEATURE_ORDER]
    df = pd.DataFrame([row], columns=FEATURE_ORDER)
    # convert to numeric where possible
    for c in df.columns:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    if df.isna().any(axis=1).any():
        return None, {"error": "non_numeric", "row": df.iloc[0].to_dict()}
    return df, None

def read_uploaded_file(path):
    """Try to read CSV/Excel robustly. Returns DataFrame or raises."""
    if path.lower().endswith(".csv"):
        try:
            return pd.read_csv(path)
        except Exception:
            # fallback to latin1
            return pd.read_csv(path, encoding="latin1")
    else:
        # excel
        return pd.read_excel(path)

# -------------------------
# Routes
# -------------------------
@app.route("/predict", methods=["POST"])
def predict():
    """
    Accepts JSON object with feature keys equal to FEATURE_ORDER.
    Returns JSON: { prediction, probability, model, record_id }
    Also inserts record into MongoDB.
    """
    if PIPELINE is None:
        return jsonify({"error": "pipeline not loaded"}), 500

    try:
        data = request.get_json(force=True)
    except Exception as e:
        return jsonify({"error": "invalid_json", "details": str(e)}), 400

    if not isinstance(data, dict):
        return jsonify({"error": "json_must_be_object"}), 400

    df, err = build_input_df_from_json(data)
    if err:
        return jsonify(err), 400

    try:
        pred = int(PIPELINE.predict(df)[0])
    except Exception as e:
        return jsonify({"error": "prediction_failed", "details": str(e)}), 500

    prob = None
    try:
        prob = float(PIPELINE.predict_proba(df)[0][1])
    except Exception:
        prob = None

    record = {
        "input": {k: data[k] for k in FEATURE_ORDER},
        "prediction": int(pred),
        "probability": prob,
        "model": BEST_MODEL,
        "source": "single",
        "timestamp": datetime.utcnow()
    }

    try:
        record_id = save_record_to_mongo(record)
    except Exception as e:
        return jsonify({"error": "db_insert_failed", "details": str(e)}), 500

    return jsonify({
        "prediction": pred,
        "probability": prob,
        "model": BEST_MODEL,
        "record_id": record_id
    }), 200

@app.route("/predict-file", methods=["POST"])
def predict_file():
    """
    Accepts multipart/form-data with 'file' field.
    Saves uploaded file to uploads/, reads it, ensures columns match FEATURE_ORDER,
    converts to numeric, predicts each row, inserts each row into MongoDB.
    Returns JSON: { results: [{row, prediction, probability, record_id}, ...], filename, saved_path }
    """
    if PIPELINE is None:
        return jsonify({"error": "pipeline not loaded"}), 500

    if "file" not in request.files:
        return jsonify({"error": "no_file_part"}), 400

    uploaded = request.files["file"]
    if uploaded.filename == "":
        return jsonify({"error": "empty_filename"}), 400

    if not allowed_ext(uploaded.filename):
        return jsonify({"error": "unsupported_file_type", "allowed": list(ALLOWED_EXT)}), 400

    filename = secure_filename(uploaded.filename)
    uid = str(uuid.uuid4())[:8]
    save_name = f"{uid}__{filename}"
    save_path = os.path.join(UPLOAD_DIR, save_name)
    uploaded.save(save_path)

    # Try read file
    try:
        df = read_uploaded_file(save_path)
    except Exception as e:
        return jsonify({"error": "read_failed", "details": str(e), "saved_path": save_path}), 400

    # Check columns
    missing = [c for c in FEATURE_ORDER if c not in df.columns]
    if missing:
        return jsonify({"error": "missing_columns", "missing": missing, "expected": FEATURE_ORDER, "saved_path": save_path}), 400

    # Reorder and convert numeric
    df_ordered = df[FEATURE_ORDER].copy()
    for c in df_ordered.columns:
        df_ordered[c] = pd.to_numeric(df_ordered[c], errors="coerce")

    bad_rows = df_ordered[df_ordered.isna().any(axis=1)]
    if not bad_rows.empty:
        return jsonify({"error": "non_numeric_rows", "problem_rows": bad_rows.index.tolist(), "saved_path": save_path}), 400

    # Predict
    try:
        preds = PIPELINE.predict(df_ordered)
    except Exception as e:
        return jsonify({"error": "prediction_failed", "details": str(e)}), 500

    try:
        proba_arr = PIPELINE.predict_proba(df_ordered)
        proba_list = [float(p[1]) for p in proba_arr]
    except Exception:
        proba_list = [None] * len(preds)

    results = []
    for i, p in enumerate(preds):
        rec = {
            "input": dict(df_ordered.iloc[i]),
            "prediction": int(p),
            "probability": proba_list[i],
            "model": BEST_MODEL,
            "source": f"file:{filename}",
            "file_saved_path": save_path,
            "row_index": int(i),
            "timestamp": datetime.utcnow()
        }
        try:
            rid = save_record_to_mongo(rec)
        except Exception as e:
            return jsonify({"error": "db_insert_failed", "details": str(e)}), 500

        results.append({
            "row": int(i),
            "prediction": int(p),
            "probability": proba_list[i],
            "record_id": rid
        })

    return jsonify({"results": results, "filename": filename, "saved_path": save_path, "model": BEST_MODEL}), 200

@app.route("/records", methods=["GET"])
def list_records():
    """Return last 50 records (most recent first) for quick verification."""
    docs = list(records_coll.find().sort("timestamp", -1).limit(50))
    out = []
    for d in docs:
        d["_id"] = str(d["_id"])
        # convert datetime to iso
        if "timestamp" in d and hasattr(d["timestamp"], "isoformat"):
            d["timestamp"] = d["timestamp"].isoformat()
        out.append(d)
    return jsonify({"count": len(out), "records": out}), 200

# -------------------------
# Run
# -------------------------
if __name__ == "__main__":
    # run on 127.0.0.1:5001 to match your frontend
    app.run(host="127.0.0.1", port=5001, debug=True) 