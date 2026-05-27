import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BrainCircuit, Activity, ActivitySquare, SlidersHorizontal, Radio, Upload } from 'lucide-react';
import HeadbandVisualizer from './components/HeadbandVisualizer';
import FeatureSliders from './components/FeatureSliders';
import PredictionDashboard from './components/PredictionDashboard';
import LiveCharts from './components/LiveCharts';
import CsvUploader from './components/CsvUploader';
import FacialAnalysis from './components/FacialAnalysis';
import { API_ENDPOINTS } from './config';

const DEFAULT_FEATURES = {
  Attention: 50,
  Meditation: 50,
  BlinkStrength: 0,
  Delta: 500000,
  Theta: 200000,
  AlphaLow: 10000,
  AlphaHigh: 10000,
  BetaLow: 5000,
  BetaHigh: 5000,
  GammaLow: 2500,
  GammaMid: 1250,
  SignalQuality: 0,
};

function App() {
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [mode, setMode] = useState('manual');
  const [prediction, setPrediction] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  // ── Core API call ────────────────────────────────────────────────────────
  const fetchPrediction = useCallback(async (currentFeatures) => {
    setIsScanning(true);
    setError(null);
    try {
      const res = await axios.post(API_ENDPOINTS.PREDICT, { features: currentFeatures });
      setPrediction(res.data);
    } catch (err) {
      console.error(err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err.message;
      setError(`AI Engine error: ${detail}`);
      setPrediction(null);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // ── CSV file upload ───────────────────────────────────────────────────────
  const handleFileUpload = useCallback(async (file) => {
    setIsScanning(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post(API_ENDPOINTS.PREDICT, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPrediction(res.data);
    } catch (err) {
      console.error(err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err.message;
      setError(`CSV processing error: ${detail}`);
      setPrediction(null);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // ── Live stream SSE ───────────────────────────────────────────────────────
  useEffect(() => {
    let eventSource;
    if (mode === 'live') {
      eventSource = new EventSource(API_ENDPOINTS.STREAM);
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const { t, ...newFeatures } = data;
        setFeatures(newFeatures);
        setHistory((prev) => {
          const next = [...prev, data];
          return next.length > 30 ? next.slice(1) : next;
        });
      };
      eventSource.onerror = () => {
        setError('Live stream connection lost. Retrying…');
      };
    } else {
      setHistory([]);
    }
    return () => {
      if (eventSource) eventSource.close();
    };
  }, [mode]);

  // ── Live mode: predict every second ──────────────────────────────────────
  useEffect(() => {
    if (mode !== 'live') return;
    const interval = setInterval(() => {
      fetchPrediction(features);
    }, 1000);
    return () => clearInterval(interval);
  }, [mode, features, fetchPrediction]);

  // ── Run prediction immediately on mount (manual) ──────────────────────────
  useEffect(() => {
    fetchPrediction(DEFAULT_FEATURES);
  }, []);

  // ── Switch to manual → re-run with current features ──────────────────────
  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === 'manual') {
      fetchPrediction(features);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-cyan-500/30 overflow-x-hidden">
      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                <BrainCircuit className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white tracking-wide">NeuroGuard AI</h1>
                <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">
                  Driver Fatigue Detection System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 rounded-full p-1 border border-white/5">
              <button
                onClick={() => handleModeChange('manual')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  mode === 'manual' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Manual
              </button>
              <button
                onClick={() => handleModeChange('csv')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  mode === 'csv' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-4 h-4" />
                CSV Upload
              </button>
              <button
                onClick={() => handleModeChange('live')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  mode === 'live'
                    ? 'bg-cyan-500/10 text-cyan-400 shadow-sm border border-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="w-4 h-4" />
                Live Stream
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main layout ────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Row 1: Left inputs + Right prediction */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left column */}
          <div className="lg:col-span-4 space-y-6">
            <HeadbandVisualizer mode={mode} isScanning={isScanning || mode === 'live'} />

            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ActivitySquare className="w-5 h-5 text-cyan-400" />
                  {mode === 'csv' ? 'Batch Data Analysis' : 'EEG Parameters'}
                </h2>
                {mode === 'manual' && (
                  <button
                    onClick={() => fetchPrediction(features)}
                    disabled={isScanning}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      isScanning
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    }`}
                  >
                    {isScanning ? 'Analyzing…' : 'Analyze'}
                  </button>
                )}
              </div>

              {mode === 'csv' ? (
                <CsvUploader onFileUpload={handleFileUpload} isScanning={isScanning} />
              ) : (
                <FeatureSliders
                  features={features}
                  setFeatures={setFeatures}
                  disabled={mode === 'live'}
                />
              )}
            </div>
          </div>

          {/* Right column — Prediction Output */}
          <div className="lg:col-span-8 space-y-6">
            <PredictionDashboard
              prediction={prediction}
              error={error}
              mode={mode}
              isScanning={isScanning}
            />

            {mode === 'live' && history.length > 0 && (
              <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                  <Activity className="w-5 h-5 text-violet-400" />
                  Live Brainwave Telemetry
                </h2>
                <LiveCharts data={history} />
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Facial Analysis — full-width centred */}
        <FacialAnalysis />

      </main>
    </div>
  );
}

export default App;
