import React from 'react'

export default function PredictionResult({ result }){
  if(!result) return <div className="p-4 rounded bg-black/20 text-slate-300">No prediction yet. Enter values or upload a CSV to see live results.</div>

  const fatigued = result.status === 'FATIGUED'

  return (
    <div className="space-y-6">
      <div className={`p-6 glass neon ${fatigued ? 'border-2 border-rose-500/40' : 'border-2 border-cyan-500/20'}`}>
        <div className="grid gap-4 md:grid-cols-[1.8fr_1fr]">
          <div>
            <div className="text-xs uppercase text-slate-400">Driver Status</div>
            <div className={`mt-3 text-4xl font-bold ${fatigued ? 'text-rose-400' : 'text-cyan-300'}`}>{result.status}</div>
            <div className="mt-2 text-slate-300">Model used: <span className="text-white">{result.model_used}</span></div>
            <div className="mt-5 rounded-3xl bg-black/20 p-4 ring-1 ring-white/10">
              <div className="text-xs uppercase text-slate-400 mb-2">Confidence</div>
              <div className="text-4xl font-semibold">{(result.confidence * 100).toFixed(1)}%</div>
              <div className="mt-3 h-3 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full ${fatigued ? 'bg-rose-400' : 'bg-cyan-400'}`} style={{width:`${Math.round(result.confidence*100)}%`}} />
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between items-center rounded-3xl bg-black/20 p-4 ring-1 ring-white/10">
            <div className="text-xs uppercase text-slate-400 mb-3">Brain activity status</div>
            <div className={`mb-4 inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${fatigued ? 'bg-rose-500/10 text-rose-300' : 'bg-cyan-500/10 text-cyan-200'}`}>
              {fatigued ? 'Critical Oscillation Detected' : 'Stable Alpha/Beta Balance'}
            </div>
            <div className="relative h-44 w-44 rounded-full bg-white/5 ring-1 ring-white/10 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white/80">{Math.round(result.probability)}%</div>
            </div>
          </div>
        </div>
      </div>
      {fatigued && (
        <div className="flex items-center gap-3 rounded-3xl bg-rose-500/10 p-4 text-rose-100 ring-1 ring-rose-500/20">
          <div className="h-12 w-12 rounded-full bg-rose-500/20 flex items-center justify-center text-xl">!</div>
          <div>
            <div className="font-semibold">Fatigue alert</div>
            <div className="text-slate-200 text-sm">Driver fatigue was detected with high confidence. Recommend taking a break and engaging adaptive assistance.</div>
          </div>
        </div>
      )}
    </div>
  )
}
