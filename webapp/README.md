# EEG Dashboard Webapp

This folder contains a Flask backend and a React frontend for the EEG Driver Fatigue Detection project.

## Backend

```powershell
cd webapp/backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

The backend serves API endpoints on `http://127.0.0.1:5050`:

* `GET /api/models`
* `POST /api/predict`
* `GET /api/stream`
* `GET /api/demo_sample`

## Frontend

```bash
cd webapp/frontend
npm install
npm start
```

The React dashboard connects to the backend and displays:

* predictive fatigue status
* confidence meter and warning indicators
* EEG analytics charts
* model comparison visuals
* demo dataset download

## Demo dataset

Download the sample input CSV from the backend at `http://127.0.0.1:5050/api/demo_sample`.
