import os
import joblib
import pandas as pd
from datetime import datetime
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import MinMaxScaler
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

def train_demo_models():
    import pathlib
    base_path = pathlib.Path(__file__).resolve().parents[1]
    print("Loading demo dataset...")
    df = pd.read_csv(base_path / "data/demo_dataset.csv")

    X = df.drop(columns=["is_fatigued", "driver_id", "epoch_id"])
    y = df["is_fatigued"]

    print("Splitting dataset...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

    # Note: SVM must have probability=True for predict_proba
    models = {
        "svc": Pipeline([("scaler", MinMaxScaler()), ("estimator", SVC(kernel="rbf", probability=True, C=100, gamma=0.03125))]),
        "randomforestclassifier": Pipeline([("scaler", MinMaxScaler()), ("estimator", RandomForestClassifier(n_estimators=100))]),
        "mlpclassifier": Pipeline([("scaler", MinMaxScaler()), ("estimator", MLPClassifier(hidden_layer_sizes=(22,), max_iter=500))]),
        "kneighborsclassifier": Pipeline([("scaler", MinMaxScaler()), ("estimator", KNeighborsClassifier())])
    }

    os.makedirs(base_path / "models/demo", exist_ok=True)
    timestamp = datetime.today().strftime("%Y-%m-%d-%H-%M-%S")

    print("Training models...")
    for name, model in models.items():
        print(f"Training {name}...")
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        acc = accuracy_score(y_test, preds)
        
        # Save exact dict format expected by models_loader
        model_wrapper = {"model": model, "score": acc}
        path = base_path / f"models/demo/{name}-{acc:.4f}-split-{timestamp}.model"
        joblib.dump(model_wrapper, path)
        print(f"Saved {name} with Accuracy {acc:.4f} to {path}")

if __name__ == "__main__":
    train_demo_models()
