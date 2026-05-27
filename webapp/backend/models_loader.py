import os
import sys
import types
from pathlib import Path
import pickle
from typing import Dict, Any
import joblib

# Workaround for unpickling models built with older pandas/sklearn versions
try:
    import pandas.core.indexes.numeric
except ImportError:
    import pandas as pd
    numeric_mod = types.ModuleType('pandas.core.indexes.numeric')
    numeric_mod.NumericIndex = pd.Index
    numeric_mod.Int64Index = pd.Index
    numeric_mod.Float64Index = pd.Index
    sys.modules['pandas.core.indexes.numeric'] = numeric_mod

import sklearn.metrics._scorer
if not hasattr(sklearn.metrics._scorer, '_PredictScorer'):
    sklearn.metrics._scorer._PredictScorer = type('DummyScorer', (), {})

MODELS_DIR = Path(__file__).resolve().parents[2] / "models" / "demo"



def load_models() -> Dict[str, Dict[str, Any]]:

    """Load all .model files from the top-level `models/` folder.

    Returns a dict keyed by basename with dict: {"model": GridSearchCV, "score": float}
    """
    models = {}
    top = Path(__file__).resolve().parents[2]
    models_path = top / "models" / "demo"
    if not models_path.exists():
        return models

    for p in models_path.glob("*.model"):
        try:
            raw = joblib.load(p)
            # raw is likely bytes because author used dump(pickle.dumps(obj))
            if isinstance(raw, (bytes, bytearray)):
                model_pickle = pickle.loads(raw)
            else:
                model_pickle = raw

            model = model_pickle.get("model") if isinstance(model_pickle, dict) else model_pickle
            score = None
            try:
                score = float(getattr(model, "best_score_", None) or getattr(model, "score", None) or 0)
            except Exception:
                score = None

            models[p.name] = {"model": model, "score": score, "path": str(p)}
        except Exception as e:
            # Some scikit-learn pickles reference internal objects that may not match
            # the currently installed sklearn version.
            models[p.name] = {"error": str(e), "path": str(p), "file": p.name}


    return models


def get_model_preview():
    """Return a lightweight preview of available models."""
    import re
    models = load_models()
    preview = []
    for name, info in models.items():
        if "error" in info:
            preview.append({"name": name, "error": info["error"]})
            continue
        model = info["model"]
        if hasattr(model, "steps"):
            model_name = type(model.steps[-1][1]).__name__
        else:
            model_name = type(getattr(model, "estimator", model)).__name__
        
        # Extract score from filename (e.g., "svc-0.9992-split-...")
        score = info.get("score")
        if score is None:
            # Try extracting from filename
            match = re.search(r'-(\d+\.\d+)-', name)
            if match:
                try:
                    score = float(match.group(1))
                except ValueError:
                    score = None
        
        preview.append({"name": name, "estimator": model_name, "score": score})
    return preview
