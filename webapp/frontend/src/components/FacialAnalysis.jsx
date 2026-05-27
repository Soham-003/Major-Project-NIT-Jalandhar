import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import {
  Camera, AlertTriangle, CheckCircle, VideoOff,
  Eye, Wind, Loader2, Activity, Clock, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Area, AreaChart, Legend
} from 'recharts';

/* ────────────────────────────────────────────────────────────────────────
   Landmark indices  (unchanged)
──────────────────────────────────────────────────────────────────────── */
const LEFT_EYE  = [362, 385, 387, 263, 373, 380];
const RIGHT_EYE = [33,  160, 158, 133, 153, 144];
const MOUTH     = [78,  81,  13,  311, 308, 402, 14, 178];

/* ── Geometry helpers (unchanged) ──────────────────────────────────── */
function dist(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }
function earCalc(idx, lm) {
  const [p1, p2, p3, p4, p5, p6] = idx.map(i => lm[i]);
  return (dist(p2, p6) + dist(p3, p5)) / (2 * dist(p1, p4));
}
function marCalc(idx, lm) {
  const [p1, p2, p3, p4, p5, p6, p7, p8] = idx.map(i => lm[i]);
  return (dist(p2, p8) + dist(p3, p7) + dist(p4, p6)) / (2 * dist(p1, p5));
}

/* ── Thresholds (unchanged) ──────────────────────────────────────── */
const EAR_THRESH = 0.25;
const MAR_THRESH = 0.60;
const CLOSED_MS  = 1500;
const CHART_MAX  = 80;   // max data points kept in chart

/* ── Custom Tooltip ──────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-2xl">
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-mono font-bold" style={{ color: p.color }}>
            {Number(p.value).toFixed(3)}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ── Radial Gauge (canvas-based, no SVG distortion) ─────────────── */
function RadialGauge({ value, max = 100, label, color = '#f43f5e', size = 120 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = size / 2, cy = size / 2, r = size * 0.38;
    const startAngle = Math.PI * 0.75;
    const endAngle   = Math.PI * 2.25;
    const pct        = Math.min(value / max, 1);
    const valAngle   = startAngle + pct * (endAngle - startAngle);

    ctx.clearRect(0, 0, size, size);

    // Track
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = size * 0.1;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Fill
    if (pct > 0) {
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, '#8b5cf6');
      grad.addColorStop(1, color);
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, valAngle);
      ctx.strokeStyle = grad;
      ctx.lineWidth = size * 0.1;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Center text
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${size * 0.22}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(pct * 100)}%`, cx, cy - size * 0.04);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `${size * 0.11}px sans-serif`;
    ctx.fillText(label, cx, cy + size * 0.16);
  }, [value, max, label, color, size]);

  return <canvas ref={canvasRef} width={size} height={size} />;
}

/* ── Event Log item ──────────────────────────────────────────────── */
function EventTag({ event, ts }) {
  const isFatigue = event === 'FATIGUED';
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${
        isFatigue
          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
      }`}
    >
      {isFatigue ? <AlertTriangle className="w-3 h-3 shrink-0" /> : <CheckCircle className="w-3 h-3 shrink-0" />}
      <span className="font-medium">{event}</span>
      <span className="text-slate-500 ml-auto font-mono">{ts}</span>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function FacialAnalysis() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const closedRef = useRef(0);

  const [landmarker,   setLandmarker]   = useState(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [cameraOn,     setCameraOn]     = useState(false);

  /* ── Core detection state (unchanged logic) ───────────────────── */
  const [status, setStatus] = useState('IDLE');
  const [reason, setReason] = useState('');
  const [earVal, setEarVal] = useState(null);
  const [marVal, setMarVal] = useState(null);

  /* ── New: chart data + event log ─────────────────────────────── */
  const [chartData,  setChartData]  = useState([]);   // [{t, ear, mar}]
  const [events,     setEvents]     = useState([]);   // [{event, ts}]
  const [frameCount, setFrameCount] = useState(0);
  const [closedPct,  setClosedPct]  = useState(0);   // 0-100, % of CLOSED_MS elapsed

  const tickRef = useRef(0);

  /* ── Load MediaPipe (unchanged) ─────────────────────────────────── */
  const initModel = async () => {
    if (landmarker) return landmarker;
    setModelLoading(true);
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      const fl = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        outputFaceBlendshapes: false,
        runningMode: 'VIDEO',
        numFaces: 1,
      });
      setLandmarker(fl);
      return fl;
    } finally {
      setModelLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!cameraOn) {
      await initModel();
      setCameraOn(true);
      setStatus('ALERT');
      setReason('Scanning…');
      setChartData([]);
      setEvents([]);
      tickRef.current = 0;
    } else {
      setCameraOn(false);
      setStatus('IDLE');
      setReason('');
      setEarVal(null);
      setMarVal(null);
      setClosedPct(0);
      closedRef.current = 0;
    }
  };

  /* ── Detection loop (logic unchanged, adds chart updates) ─────── */
  useEffect(() => {
    if (!cameraOn || !landmarker) return;
    let rafId;
    let lastTime = -1;
    let lastChartUpdate = 0;

    const addEvent = (evt) => {
      const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
      setEvents(prev => [{ event: evt, ts }, ...prev].slice(0, 10));
    };

    const loop = () => {
      rafId = requestAnimationFrame(loop);
      const video  = webcamRef.current?.video;
      const canvas = canvasRef.current;
      if (!video || video.readyState < 4 || !canvas) return;

      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      const now = performance.now();
      if (lastTime === video.currentTime) return;
      lastTime = video.currentTime;

      const results = landmarker.detectForVideo(video, now);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.faceLandmarks?.length > 0) {
        const lm = results.faceLandmarks[0];

        /* ── Draw overlay (unchanged) ───── */
        const du = new DrawingUtils(ctx);
        du.drawConnectors(lm, FaceLandmarker.FACE_LANDMARKS_TESSELATION,
          { color: 'rgba(6,182,212,0.35)', lineWidth: 0.8 });
        du.drawConnectors(lm, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
          { color: '#f43f5e', lineWidth: 2 });
        du.drawConnectors(lm, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
          { color: '#f43f5e', lineWidth: 2 });
        du.drawConnectors(lm, FaceLandmarker.FACE_LANDMARKS_LIPS,
          { color: '#8b5cf6', lineWidth: 2 });

        /* ── Compute metrics (unchanged logic) ──────── */
        const avgEar  = (earCalc(LEFT_EYE, lm) + earCalc(RIGHT_EYE, lm)) / 2;
        const mouthAr = marCalc(MOUTH, lm);
        setEarVal(avgEar.toFixed(3));
        setMarVal(mouthAr.toFixed(3));
        setFrameCount(c => c + 1);

        /* ── Eye-closure gauge ──────────────────────── */
        if (avgEar < EAR_THRESH) {
          if (!closedRef.current) closedRef.current = now;
          const elapsed = now - closedRef.current;
          setClosedPct(Math.min((elapsed / CLOSED_MS) * 100, 100));

          if (elapsed > CLOSED_MS) {
            setStatus(prev => {
              if (prev !== 'FATIGUED') addEvent('FATIGUED');
              return 'FATIGUED';
            });
            setReason('Prolonged Eye Closure Detected');
          }
        } else {
          const wasClosedLong = closedRef.current && (now - closedRef.current) > CLOSED_MS;
          closedRef.current = 0;
          setClosedPct(0);

          if (mouthAr > MAR_THRESH) {
            setStatus(prev => {
              if (prev !== 'FATIGUED') addEvent('FATIGUED');
              return 'FATIGUED';
            });
            setReason('Yawning Detected');
          } else {
            setStatus(prev => {
              if (prev === 'FATIGUED' && wasClosedLong) addEvent('ALERT');
              return 'ALERT';
            });
            setReason('Eyes open — normal activity');
          }
        }

        /* ── Feed chart (throttle to ~10 Hz) ───────── */
        if (now - lastChartUpdate > 100) {
          lastChartUpdate = now;
          tickRef.current += 1;
          const t = tickRef.current;
          setChartData(prev => {
            const next = [...prev, {
              t,
              ear: parseFloat(avgEar.toFixed(3)),
              mar: parseFloat(mouthAr.toFixed(3)),
            }];
            return next.length > CHART_MAX ? next.slice(-CHART_MAX) : next;
          });
        }

      } else {
        setStatus('UNKNOWN');
        setReason('No face detected in frame');
        setEarVal(null);
        setMarVal(null);
        setClosedPct(0);
      }
    };

    loop();
    return () => cancelAnimationFrame(rafId);
  }, [cameraOn, landmarker]);

  /* ── Color helpers ─────────────────────────────────────────────── */
  const statusGradient = status === 'FATIGUED'
    ? 'from-rose-500/20 to-transparent'
    : status === 'ALERT'
    ? 'from-emerald-500/20 to-transparent'
    : 'from-slate-800/40 to-transparent';

  const borderColor = status === 'FATIGUED'
    ? 'border-rose-500/30'
    : status === 'ALERT'
    ? 'border-emerald-500/20'
    : 'border-white/5';

  return (
    <div className={`w-full rounded-3xl border backdrop-blur-sm relative overflow-hidden transition-all duration-700 bg-slate-900/60 ${borderColor}`}>

      {/* ── Top accent gradient ──────────────────────────────────── */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 opacity-70" />
      <div className={`absolute top-0 left-0 w-full h-40 bg-gradient-to-b ${statusGradient} pointer-events-none transition-all duration-700`} />

      <div className="relative p-6 space-y-6">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="p-1.5 bg-violet-500/20 rounded-lg border border-violet-500/30">
                <Camera className="w-5 h-5 text-violet-400" />
              </div>
              Facial Fatigue Monitor
            </h2>
            <p className="text-xs text-slate-500 mt-1 ml-10">
              Real-time MediaPipe AI · EAR / MAR biometric analysis · runs entirely in-browser
            </p>
          </div>

          <div className="flex items-center gap-3">
            {cameraOn && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 rounded-full px-3 py-1.5 border border-white/5">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span className="font-mono text-cyan-400">{frameCount}</span> frames
              </div>
            )}
            <button
              onClick={handleToggle}
              disabled={modelLoading}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                modelLoading
                  ? 'bg-slate-800 text-slate-400 cursor-wait'
                  : cameraOn
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                  : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-[0_0_25px_rgba(139,92,246,0.5)]'
              }`}
            >
              {modelLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Loading AI Model…</>
              ) : cameraOn ? (
                <><VideoOff className="w-4 h-4" /> Stop Camera</>
              ) : (
                <><Camera className="w-4 h-4" /> Start Camera</>
              )}
            </button>
          </div>
        </div>

        {/* ── Main two-column grid ─────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* ══ LEFT: Webcam + status card ══════════════════════════ */}
          <div className="space-y-4">

            {/* Camera feed */}
            <div className="relative bg-black/70 rounded-2xl overflow-hidden border border-white/5 aspect-video flex items-center justify-center">
              {!cameraOn ? (
                <div className="flex flex-col items-center text-slate-600 gap-3">
                  <div className="p-5 bg-slate-800/60 rounded-full border border-white/5">
                    <Camera className="w-10 h-10 opacity-40" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-500">Camera is off</p>
                    <p className="text-xs text-slate-700 mt-1">Click "Start Camera" to begin analysis</p>
                  </div>
                </div>
              ) : (
                <>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    className="w-full h-full object-cover"
                    videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
                    mirrored
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  {/* Overlays */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 rounded-full px-3 py-1 text-xs font-mono border border-white/5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-slate-300">LIVE</span>
                  </div>
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold border ${
                    status === 'FATIGUED'
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      : status === 'ALERT'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-700/50 border-white/10 text-slate-400'
                  }`}>
                    {status}
                  </div>
                  {/* EAR / MAR live overlay */}
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-mono bg-black/70 border ${
                      earVal !== null && parseFloat(earVal) < EAR_THRESH
                        ? 'border-rose-500/50 text-rose-300'
                        : 'border-white/10 text-slate-300'
                    }`}>
                      EAR {earVal ?? '—'}
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-mono bg-black/70 border ${
                      marVal !== null && parseFloat(marVal) > MAR_THRESH
                        ? 'border-amber-500/50 text-amber-300'
                        : 'border-white/10 text-slate-300'
                    }`}>
                      MAR {marVal ?? '—'}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Status + gauges row */}
            <div className="grid grid-cols-3 gap-3">

              {/* Status card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={status}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.25 }}
                  className={`col-span-1 rounded-2xl border p-4 flex flex-col items-center justify-center text-center gap-2 ${
                    status === 'FATIGUED'
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : status === 'ALERT'
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-slate-800/50 border-white/5'
                  }`}
                >
                  {status === 'FATIGUED' && <AlertTriangle className="w-7 h-7 text-rose-400" />}
                  {status === 'ALERT'    && <CheckCircle   className="w-7 h-7 text-emerald-400" />}
                  {(status === 'UNKNOWN' || status === 'IDLE') && <Camera className="w-7 h-7 text-slate-600" />}
                  <div>
                    <p className={`text-base font-bold leading-none ${
                      status === 'FATIGUED' ? 'text-rose-400'
                      : status === 'ALERT'  ? 'text-emerald-400'
                      : 'text-slate-500'
                    }`}>
                      {status === 'IDLE' ? '—' : status}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight">{reason || 'Inactive'}</p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* EAR gauge */}
              <div className="rounded-2xl border border-white/5 bg-slate-800/40 p-3 flex flex-col items-center justify-center gap-1">
                <RadialGauge
                  value={earVal ? Math.min(parseFloat(earVal) / 0.5, 1) * 100 : 0}
                  label="EAR"
                  color={earVal && parseFloat(earVal) < EAR_THRESH ? '#f43f5e' : '#06b6d4'}
                  size={88}
                />
                <p className="text-[10px] text-slate-500">Eye Openness</p>
              </div>

              {/* MAR gauge */}
              <div className="rounded-2xl border border-white/5 bg-slate-800/40 p-3 flex flex-col items-center justify-center gap-1">
                <RadialGauge
                  value={marVal ? Math.min(parseFloat(marVal) / 1.0, 1) * 100 : 0}
                  label="MAR"
                  color={marVal && parseFloat(marVal) > MAR_THRESH ? '#f59e0b' : '#8b5cf6'}
                  size={88}
                />
                <p className="text-[10px] text-slate-500">Mouth Openness</p>
              </div>
            </div>

            {/* Eye-closure countdown bar */}
            {cameraOn && (
              <div className="rounded-xl border border-white/5 bg-slate-800/40 p-3">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Eye Closure Timer</span>
                  <span className="font-mono">{closedPct.toFixed(0)}% / {CLOSED_MS / 1000}s</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${closedPct > 66 ? 'bg-rose-500' : closedPct > 33 ? 'bg-amber-400' : 'bg-cyan-400'}`}
                    animate={{ width: `${closedPct}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <p className="text-[10px] text-slate-600 mt-1">Triggers FATIGUED alert after {CLOSED_MS / 1000}s of continuous closure</p>
              </div>
            )}

            {/* Event log */}
            {cameraOn && (
              <div className="rounded-xl border border-white/5 bg-slate-800/30 p-3">
                <p className="text-xs text-slate-400 flex items-center gap-1 mb-2">
                  <Zap className="w-3 h-3 text-amber-400" /> Detection Events
                </p>
                <div className="space-y-1.5 max-h-28 overflow-y-auto scrollbar-thin">
                  <AnimatePresence>
                    {events.length === 0 ? (
                      <p className="text-xs text-slate-600 italic">No events yet…</p>
                    ) : (
                      events.map((e, i) => <EventTag key={i} {...e} />)
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          {/* ══ RIGHT: Charts ════════════════════════════════════════ */}
          <div className="space-y-4">

            {/* EAR line chart */}
            <div className="bg-slate-800/40 rounded-2xl border border-white/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-slate-300">Eye Aspect Ratio (EAR)</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="w-2 h-0.5 bg-rose-500/60 inline-block" />
                  <span>Threshold {EAR_THRESH}</span>
                </div>
              </div>
              <div className="h-36">
                {chartData.length < 2 ? (
                  <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                    {cameraOn ? 'Collecting data…' : 'Start camera to see live EAR chart'}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="earGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="t" hide />
                      <YAxis domain={[0, 0.6]} tick={{ fontSize: 9, fill: '#64748b' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={EAR_THRESH} stroke="#f43f5e" strokeDasharray="4 4" strokeOpacity={0.7} />
                      <Area
                        type="monotone" dataKey="ear" name="EAR"
                        stroke="#06b6d4" strokeWidth={2}
                        fill="url(#earGrad)" dot={false} isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* MAR line chart */}
            <div className="bg-slate-800/40 rounded-2xl border border-white/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-semibold text-slate-300">Mouth Aspect Ratio (MAR)</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="w-2 h-0.5 bg-amber-400/60 inline-block" />
                  <span>Threshold {MAR_THRESH}</span>
                </div>
              </div>
              <div className="h-36">
                {chartData.length < 2 ? (
                  <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                    {cameraOn ? 'Collecting data…' : 'Start camera to see live MAR chart'}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="marGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="t" hide />
                      <YAxis domain={[0, 1.2]} tick={{ fontSize: 9, fill: '#64748b' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={MAR_THRESH} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.7} />
                      <Area
                        type="monotone" dataKey="mar" name="MAR"
                        stroke="#8b5cf6" strokeWidth={2}
                        fill="url(#marGrad)" dot={false} isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Combined overlay chart */}
            <div className="bg-slate-800/40 rounded-2xl border border-white/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-fuchsia-400" />
                <span className="text-sm font-semibold text-slate-300">EAR vs MAR — Combined View</span>
              </div>
              <div className="h-36">
                {chartData.length < 2 ? (
                  <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                    {cameraOn ? 'Collecting data…' : 'Start camera to see combined chart'}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="t" hide />
                      <YAxis domain={[0, 1.2]} tick={{ fontSize: 9, fill: '#64748b' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        iconType="circle" iconSize={8}
                        wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }}
                      />
                      <ReferenceLine y={EAR_THRESH} stroke="#f43f5e" strokeDasharray="3 3" strokeOpacity={0.5} />
                      <ReferenceLine y={MAR_THRESH} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.5} />
                      <Line type="monotone" dataKey="ear" name="EAR" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="mar" name="MAR" stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Threshold legend */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              {[
                { icon: <Eye className="w-3 h-3" />, label: 'Eye closure', value: `EAR < ${EAR_THRESH}`, color: 'text-cyan-400' },
                { icon: <Wind className="w-3 h-3" />, label: 'Yawn detect', value: `MAR > ${MAR_THRESH}`, color: 'text-violet-400' },
                { icon: <Clock className="w-3 h-3" />, label: 'Alert delay', value: `${CLOSED_MS / 1000}s hold`, color: 'text-amber-400' },
              ].map(({ icon, label, value, color }) => (
                <div key={label} className="bg-slate-800/40 rounded-xl border border-white/5 p-3 text-center">
                  <div className={`flex items-center justify-center gap-1 ${color} mb-1`}>{icon}</div>
                  <p className="text-slate-500">{label}</p>
                  <p className={`font-mono font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
