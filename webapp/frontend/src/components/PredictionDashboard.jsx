import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Brain, ShieldAlert, Loader2, TrendingUp, TrendingDown } from 'lucide-react';

export default function PredictionDashboard({ prediction, error, mode, isScanning }) {

  /* ── Scanning spinner ──────────────────────────────────────────── */
  if (isScanning) {
    return (
      <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-12 backdrop-blur-sm flex flex-col items-center justify-center text-center min-h-[300px]">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
        <h3 className="text-lg font-medium text-slate-300">Analyzing EEG Signal…</h3>
        <p className="text-slate-500 text-sm mt-1">Running RandomForest inference on 12 NeuroSky features</p>
      </div>
    );
  }

  /* ── Error state ───────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-8 backdrop-blur-sm flex items-start gap-4">
        <div className="p-2 bg-rose-500/20 rounded-xl shrink-0">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h3 className="text-rose-300 font-semibold mb-1">Analysis Failed</h3>
          <p className="text-rose-400/80 text-sm break-words">{error}</p>
          <p className="text-slate-500 text-xs mt-2">Make sure the Flask backend is running on port 5050.</p>
        </div>
      </div>
    );
  }

  /* ── No result yet ─────────────────────────────────────────────── */
  if (!prediction) {
    return (
      <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-12 backdrop-blur-sm flex flex-col items-center justify-center text-center min-h-[300px]">
        <Brain className="w-12 h-12 text-slate-700 mb-4" />
        <h3 className="text-xl font-medium text-slate-300">Awaiting Analysis</h3>
        <p className="text-slate-500 mt-2 max-w-md text-sm">
          {mode === 'manual' && 'Adjust the EEG sliders above and click Analyze.'}
          {mode === 'csv'    && 'Upload a CSV file and click Analyze CSV.'}
          {mode === 'live'   && 'Starting live stream — prediction appears automatically.'}
        </p>
      </div>
    );
  }

  /* ── Result ────────────────────────────────────────────────────── */
  const isFatigued   = prediction.status === 'FATIGUED';
  // confidence = probability of the predicted class (always high for RF when it's sure)
  const confPercent  = Math.round((prediction.confidence ?? 0) * 100);
  const probFatigued = prediction.prob_fatigued ?? (isFatigued ? confPercent : 100 - confPercent);
  const probAlert    = prediction.prob_alert    ?? (isFatigued ? 100 - confPercent : confPercent);

  return (
    <div className="space-y-6">

      {/* ── Main status card ─────────────────────────────────────── */}
      <motion.div
        key={prediction.status + confPercent}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`relative overflow-hidden rounded-3xl border p-8 transition-colors duration-500 ${
          isFatigued
            ? 'bg-rose-500/10 border-rose-500/30'
            : 'bg-emerald-500/10 border-emerald-500/30'
        }`}
      >
        {/* Glow blob */}
        <div className={`absolute -right-20 -top-20 w-72 h-72 rounded-full blur-3xl opacity-20 ${
          isFatigued ? 'bg-rose-500' : 'bg-emerald-500'
        }`} />

        <div className="grid md:grid-cols-2 gap-8 relative z-10">

          {/* Status text */}
          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
              Driver Cognitive State
            </p>
            <div className="flex items-center gap-4 mb-4">
              {isFatigued
                ? <ShieldAlert className="w-12 h-12 text-rose-400 shrink-0" />
                : <CheckCircle className="w-12 h-12 text-emerald-400 shrink-0" />
              }
              <span className={`text-5xl font-extrabold tracking-tight ${
                isFatigued ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {prediction.status}
              </span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed max-w-xs">
              {isFatigued
                ? 'Critical fatigue detected: high Delta/Theta power, low Attention, elevated Blink rate. Immediate rest recommended.'
                : 'Driver is alert: strong Beta/Gamma activity, high Attention, normal Blink strength. Safe to continue.'}
            </p>

            {/* Probability bars */}
            <div className="mt-5 space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3 h-3"/>Alert</span>
                  <span className="text-slate-300 font-mono">{probAlert.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${probAlert}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-rose-400 flex items-center gap-1"><TrendingDown className="w-3 h-3"/>Fatigued</span>
                  <span className="text-slate-300 font-mono">{probFatigued.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-rose-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${probFatigued}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Confidence ring */}
          <div className="flex flex-col items-center justify-center bg-black/20 rounded-2xl p-6 border border-white/5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-5">
              Model Confidence
            </p>
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor"
                  strokeWidth="8" className="text-slate-800" />
                <motion.circle
                  cx="50" cy="50" r="40" fill="none" stroke="currentColor"
                  strokeWidth="8" strokeDasharray="251.2"
                  initial={{ strokeDashoffset: 251.2 }}
                  animate={{ strokeDashoffset: 251.2 - (251.2 * confPercent) / 100 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className={isFatigued ? 'text-rose-500' : 'text-emerald-500'}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">{confPercent}%</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                  Sure
                </span>
              </div>
            </div>
            <p className={`text-xs mt-4 font-medium ${isFatigued ? 'text-rose-400' : 'text-emerald-400'}`}>
              {confPercent >= 90
                ? 'Very high confidence'
                : confPercent >= 70
                ? 'High confidence'
                : confPercent >= 50
                ? 'Moderate confidence'
                : 'Low confidence — borderline case'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Detail cards ─────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-6">

        {/* Model info */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
          <h4 className="text-sm font-semibold text-slate-300 mb-4">Model Information</h4>
          <div className="space-y-3">
            {[
              ['Active Model',    <span className="font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded text-xs">{prediction.model_used}</span>],
              ['Feature Count',   '12 NeuroSky Metrics'],
              ['Preprocessing',   'MinMaxScaler'],
              ['Alert %',         `${probAlert.toFixed(1)}%`],
              ['Fatigue %',       `${probFatigued.toFixed(1)}%`],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                <span className="text-xs text-slate-500">{label}</span>
                <span className="text-sm text-white">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fatigue indicators */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
          <h4 className="text-sm font-semibold text-slate-300 mb-4">Key Fatigue Indicators</h4>
          <div className="space-y-3">
            {[
              { label: 'Attention (low → fatigued)',    pct: 90, color: 'bg-violet-500' },
              { label: 'Delta/Theta (high → fatigued)', pct: 85, color: 'bg-violet-400' },
              { label: 'Meditation (high → fatigued)',  pct: 75, color: 'bg-violet-400' },
              { label: 'Blink Strength',                pct: 60, color: 'bg-violet-300' },
              { label: 'Gamma (low → fatigued)',        pct: 55, color: 'bg-violet-200' },
            ].map(({ label, pct, color }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-slate-500">{pct}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
