# 🧠 EEG Driver Fatigue Detection System

<p align="center">
  <img src="readme-pics/header_image.png" alt="EEG Driver Fatigue Detection Banner" width="100%"/>
</p>

> **Real-time EEG-based driver fatigue detection** using machine learning — featuring a Flask REST API backend and a React dashboard frontend.

---

## 📌 Overview

This project implements a driver fatigue detection system based on EEG (Electroencephalogram) signals. It applies **multiple entropy fusion analysis** as described in the research paper:

> 📄 **[Driver fatigue detection through multiple entropy fusion analysis in an EEG-based system](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0188756)**

The full project lives inside the **`webapp/`** folder, which contains:
- A **Flask** backend that loads trained ML models and exposes prediction APIs
- A **React** frontend dashboard with live EEG charts, fatigue prediction, and facial analysis

---

## 🗂️ Project Structure

```
webapp/
├── backend/                  # Flask REST API
│   ├── app.py                # Main Flask application
│   ├── models_loader.py      # Loads trained .model files
│   ├── requirements.txt      # Python dependencies
│   └── demo/
│       └── sample_input.csv  # Sample EEG CSV for testing
│
└── frontend/                 # React Dashboard (Create React App)
    ├── public/
    │   └── index.html
    └── src/
        ├── App.jsx
        ├── config.js         # API base URL config
        ├── components/
        │   ├── BrainwaveCanvas.jsx
        │   ├── ChartSetup.js
        │   ├── CsvUploader.jsx
        │   ├── FacialAnalysis.jsx
        │   ├── FeatureSliders.jsx
        │   ├── HeadbandVisualizer.jsx
        │   ├── LiveCharts.jsx
        │   ├── LiveStreamChart.jsx
        │   ├── PredictionDashboard.jsx
        │   ├── PredictionForm.jsx
        │   ├── PredictionResult.jsx
        │   ├── Sidebar.jsx
        │   └── StatCard.jsx
        └── pages/
            ├── Landing.jsx
            ├── Dashboard.jsx
            ├── Predict.jsx
            ├── EEGAnalytics.jsx
            ├── ModelPerformance.jsx
            └── About.jsx
```

---

## ⚙️ Tech Stack

| Layer      | Technology                                        |
|------------|---------------------------------------------------|
| Backend    | Python, Flask, Flask-CORS                         |
| ML Models  | scikit-learn (SVM, Random Forest, KNN, MLP)       |
| Data       | pandas, NumPy, joblib                             |
| Frontend   | React 18, React Router v6                         |
| Charts     | Chart.js, react-chartjs-2, Recharts               |
| Animations | Framer Motion                                     |
| Styling    | Tailwind CSS                                      |
| Vision     | MediaPipe Tasks Vision (facial analysis)          |

---

## 🚀 Setup & Running

### 1. Backend (Flask API)

```powershell
cd webapp/backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1      # Windows PowerShell
# source venv/bin/activate       # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Start the server
python app.py
```

The backend runs at: **`http://127.0.0.1:5050`**

---

### 2. Frontend (React Dashboard)

```bash
cd webapp/frontend

# Install dependencies
npm install

# Start development server
npm start
```

The dashboard runs at: **`http://localhost:3000`**

> ⚠️ Make sure the **backend is running** before starting the frontend so API calls work correctly.

---

## 🔌 API Endpoints

| Method | Endpoint           | Description                                               |
|--------|--------------------|-----------------------------------------------------------|
| GET    | `/api/models`      | List all loaded ML models and their metadata              |
| POST   | `/api/predict`     | Run fatigue prediction (JSON or CSV file upload)          |
| GET    | `/api/stream`      | Server-Sent Events stream simulating live EEG brainwaves  |
| GET    | `/api/demo_sample` | Download a sample `sample_input.csv` for testing          |

### `POST /api/predict` — Example (JSON)

```json
{
  "features": {
    "Attention": 25,
    "Meditation": 82,
    "BlinkStrength": 180,
    "Delta": 1200000,
    "Theta": 650000,
    "AlphaLow": 5000,
    "AlphaHigh": 4500,
    "BetaLow": 3000,
    "BetaHigh": 2000,
    "GammaLow": 8000,
    "GammaMid": 5000,
    "SignalQuality": 0
  }
}
```

**Response:**
```json
{
  "status": "FATIGUED",
  "label": 1,
  "confidence": 0.9712,
  "probability": 97.1,
  "prob_alert": 2.9,
  "prob_fatigued": 97.1,
  "model_used": "RandomForestClassifier",
  "model_name": "randomforestclassifier-1.0000-split-..."
}
```

---

## 🖥️ Dashboard Pages

| Page               | Description                                                    |
|--------------------|----------------------------------------------------------------|
| **Landing**        | Project overview and quick-start                              |
| **Dashboard**      | Live EEG signal stream with real-time fatigue status           |
| **Predict**        | Manual feature input or CSV upload for fatigue prediction      |
| **EEG Analytics**  | EEG waveform analysis and brainwave visualizations             |
| **Model Performance** | Comparison of ML model metrics (accuracy, ROC, F1)         |
| **About**          | Research background and methodology                            |

---

## 🤖 ML Models

The system uses four classifiers trained on EEG entropy features:

| Model               | Split Accuracy | LOO Accuracy |
|---------------------|---------------|-------------|
| RandomForestClassifier | **1.0000**  | 0.3513      |
| SVC                 | 0.9992        | 0.3217      |
| MLPClassifier       | 0.9945        | 0.3468      |
| KNeighborsClassifier| 0.9825        | 0.4620      |

Models are loaded automatically from the `models/` directory at the project root. The backend prefers **RandomForest → KNN → SVC → MLP** by default.

---

## 📊 Input Features

The prediction API expects the following 12 EEG features (compatible with NeuroSky MindWave headset output):

| Feature        | Description                        |
|----------------|------------------------------------|
| `Attention`    | Attention level (0–100)            |
| `Meditation`   | Meditation/relaxation level (0–100)|
| `BlinkStrength`| Eye blink strength (0–255)         |
| `Delta`        | Delta wave power (0.5–4 Hz)        |
| `Theta`        | Theta wave power (4–8 Hz)          |
| `AlphaLow`     | Low alpha wave power (8–10 Hz)     |
| `AlphaHigh`    | High alpha wave power (10–13 Hz)   |
| `BetaLow`      | Low beta wave power (13–22 Hz)     |
| `BetaHigh`     | High beta wave power (22–38 Hz)    |
| `GammaLow`     | Low gamma wave power (38–42 Hz)    |
| `GammaMid`     | Mid gamma wave power (42–50 Hz)    |
| `SignalQuality`| Signal quality indicator (0 = good)|

---

## 🧪 Research Background

This project is based on EEG data collected from **12 drivers** under two states:
- **Normal state**: Last 5 minutes of 20-minute driving
- **Fatigue state**: Last 5 minutes of 40–60 minute driving

**Feature extraction** uses four entropy measures per EEG epoch:
- **PE** — Spectral Entropy (frequency domain)
- **AE** — Approximate Entropy (time domain)
- **SE** — Sample Entropy (time domain)
- **FE** — Fuzzy Entropy (noise-resistant)

**Electrode cap**: 32 channels (30 effective + 2 reference), sectioned into **1-second epochs** (300 epochs per 5-minute session).

---

## 📸 Figures

### T-SNE Visualization of Dataset
![](reports/figures/data_tsne.png)

### Model Comparison (50:50 Split)
![](reports/figures/model-compare-2022-03-02-12-34-35-.png)

### ROC Curves

| RandomForestClassifier (AUC = 1.000) | SVC (AUC = 0.999) |
|--------------------------------------|-------------------|
| ![](reports/figures/randomforestclassifier-1.0000-roc-2022-03-02-12-34-35-max_features_22___n_estimators_500.png) | ![](reports/figures/svc-0.9992-roc-2022-03-02-12-34-34-c_100___gamma_0.03125.png) |

| KNeighborsClassifier (AUC = 0.983) | MLPClassifier (AUC = 0.994) |
|------------------------------------|-----------------------------|
| ![](reports/figures/kneighborsclassifier-0.9826-roc-2022-03-02-12-34-34-weights_uniform.png) | ![](reports/figures/mlpclassifier-0.9944-roc-2022-03-02-12-34-35-alpha_0.05___learning_rate_constant.png) |

---

## 📄 License

This project is for academic purposes — **NIT Jalandhar Major Project**.
