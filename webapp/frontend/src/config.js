// API Configuration
// Use localhost:3000 environment if REACT_APP_API_URL is set, otherwise default to 127.0.0.1:5050

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5050';

export const API_ENDPOINTS = {
  MODELS: `${API_BASE_URL}/api/models`,
  PREDICT: `${API_BASE_URL}/api/predict`,
  DEMO_SAMPLE: `${API_BASE_URL}/api/demo_sample`,
  STREAM: `${API_BASE_URL}/api/stream`,
};
