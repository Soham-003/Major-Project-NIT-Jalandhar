from flask import Flask, jsonify, request, Response, send_file
from flask_cors import CORS
import time
import sys
import pandas as pd
import numpy as np
import joblib
import pickle
from pathlib import Path
from models_loader import load_models, get_model_preview

app = Flask(__name__)
CORS(app)

ORDERED_COLS = [
    "Attention", "Meditation", "BlinkStrength",
    "Delta", "Theta", "AlphaLow", "AlphaHigh",
    "BetaLow", "BetaHigh", "GammaLow", "GammaMid", "SignalQuality"
]


def _pick_best_model(models):
    """Prefer RandomForest → KNN → SVC → MLP → anything usable (not MLP first – it over-saturates)."""
    usable = {n: m for n, m in models.items() if "error" not in m}
    if not usable:
        return None, None
    preference = ["randomforest", "kneighbors", "svc", "mlp"]
    for pref in preference:
        for name, m in usable.items():
            if pref in name.lower():
                return name, m
    return next(iter(usable.items()))


@app.route("/api/models", methods=["GET"])
def api_models():
    """Return preview of models available."""
    preview = get_model_preview()
    return jsonify({"models": preview})


@app.route("/api/predict", methods=["POST"])
def api_predict():
    """Accept JSON with `features` dict or CSV file upload.

    Returns prediction label, status (FATIGUED/ALERT), and calibrated confidence.
    """
    try:
        models = load_models()
        model_name, chosen = _pick_best_model(models)
        if not chosen:
            return jsonify({"error": "No usable models found"}), 500

        model = chosen["model"]

        # ── Parse input ────────────────────────────────────────────────────
        if "file" in request.files:
            f = request.files["file"]
            df = pd.read_csv(f)
            # Drop label columns if present
            for drop_col in ["is_fatigued", "driver_id", "epoch_id"]:
                if drop_col in df.columns:
                    df = df.drop(columns=[drop_col])
            X = df.reindex(columns=ORDERED_COLS, fill_value=0).iloc[0:1]
        else:
            try:
                data = request.get_json(force=True)
            except Exception as json_err:
                print(f"JSON parse error: {json_err}", file=sys.stderr)
                return jsonify({"error": "Invalid JSON", "detail": str(json_err)}), 400

            features = data.get("features")
            if not features:
                return jsonify({"error": "No features provided"}), 400

            if isinstance(features, dict):
                X = pd.DataFrame([{k: float(features.get(k, 0)) for k in ORDERED_COLS}])
            else:
                X = pd.DataFrame(features, columns=ORDERED_COLS)

        # ── Clean – keep as named DataFrame so MinMaxScaler has feature names ──
        X = X[ORDERED_COLS].replace([np.inf, -np.inf], np.nan).fillna(0).astype(float)

        # ── Predict ────────────────────────────────────────────────────────
        try:
            label = int(model.predict(X)[0])

            if hasattr(model, "predict_proba"):
                probs = model.predict_proba(X)[0]   # [prob_class0, prob_class1]
                prob_alert    = float(probs[0])
                prob_fatigued = float(probs[1])
                # confidence = probability of the predicted class (0→alert prob, 1→fatigue prob)
                confidence = prob_fatigued if label == 1 else prob_alert
            else:
                prob_alert    = 1.0 if label == 0 else 0.0
                prob_fatigued = 1.0 if label == 1 else 0.0
                confidence    = 1.0

        except Exception as e:
            print(f"Prediction error: {e}", file=sys.stderr)
            return jsonify({"error": "Model prediction failed", "detail": str(e)}), 500

        status = "FATIGUED" if label == 1 else "ALERT"

        if hasattr(model, "steps"):
            model_used_name = type(model.steps[-1][1]).__name__
        else:
            model_used_name = type(getattr(model, "estimator", model)).__name__

        return jsonify({
            "status":        status,
            "label":         label,
            "confidence":    round(confidence, 4),
            "probability":   round(prob_fatigued * 100, 1),   # fatigue % for UI ring
            "prob_alert":    round(prob_alert    * 100, 1),
            "prob_fatigued": round(prob_fatigued * 100, 1),
            "model_used":    model_used_name,
            "model_name":    model_name,
        })
    except Exception as e:
        import traceback
        print(f"Unexpected error: {e}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return jsonify({"error": "Server error", "detail": str(e)}), 500


@app.route("/api/stream")
def api_stream():
    """Server-sent events stream that simulates EEG brainwave values."""

    def gen():
        t = 0.0
        while True:
            # Gradually drift between alert and fatigued states to demo the live mode
            fatigue_cycle = (np.sin(t * 0.08) + 1) / 2   # 0=alert, 1=fatigued
            vals = {
                "t": t,
                "Attention":    int(max(1,  min(100, 80 - 60 * fatigue_cycle + 5 * np.random.randn()))),
                "Meditation":   int(max(1,  min(100, 30 + 55 * fatigue_cycle + 5 * np.random.randn()))),
                "BlinkStrength":int(max(0,  min(255, 30 + 180 * fatigue_cycle + 10 * np.random.randn()))),
                "Delta":        int(max(1000, 250000 + 1400000 * fatigue_cycle + 50000 * np.random.randn())),
                "Theta":        int(max(1000, 120000 +  700000 * fatigue_cycle + 30000 * np.random.randn())),
                "AlphaLow":     int(max(500,  20000  -  18000  * fatigue_cycle + 2000  * np.random.randn())),
                "AlphaHigh":    int(max(500,  18000  -  16000  * fatigue_cycle + 2000  * np.random.randn())),
                "BetaLow":      int(max(500,  15000  -  13000  * fatigue_cycle + 1500  * np.random.randn())),
                "BetaHigh":     int(max(500,  12000  -  10500  * fatigue_cycle + 1500  * np.random.randn())),
                "GammaLow":     int(max(1000, 50000  -  45000  * fatigue_cycle + 5000  * np.random.randn())),
                "GammaMid":     int(max(500,  30000  -  27000  * fatigue_cycle + 3000  * np.random.randn())),
                "SignalQuality": 0 if np.random.rand() > 0.05 else 25,
            }
            yield f"data: {pd.Series(vals).to_json()}\n\n"
            t += 0.05
            time.sleep(0.05)

    return Response(gen(), mimetype="text/event-stream")


@app.route("/api/demo_sample", methods=["GET"])
def api_demo_sample():
    p = Path(__file__).resolve().parents[0] / "demo" / "sample_input.csv"
    if not p.exists():
        # Generate one on the fly
        sample = {col: 0 for col in ORDERED_COLS}
        sample.update({"Attention": 25, "Meditation": 82, "BlinkStrength": 180,
                       "Delta": 1200000, "Theta": 650000, "SignalQuality": 0})
        df = pd.DataFrame([sample])
        import io
        buf = io.StringIO()
        df.to_csv(buf, index=False)
        return Response(buf.getvalue(), mimetype="text/csv",
                        headers={"Content-Disposition": "attachment; filename=sample_input.csv"})
    return send_file(str(p), mimetype="text/csv", as_attachment=True, download_name="sample_input.csv")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5050, debug=True)
