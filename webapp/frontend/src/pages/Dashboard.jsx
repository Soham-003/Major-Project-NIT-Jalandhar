import React from 'react'
import StatCard from '../components/StatCard'
import LiveStreamChart from '../components/LiveStreamChart'

export default function Dashboard(){
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="flex-1 grid gap-4 sm:grid-cols-2">
          <StatCard title="Current Fatigue Risk" value="24%" description="Low risk detected from latest EEG input" />
          <StatCard title="Model Confidence" value="92.7%" description="AI is highly confident in the current prediction" />
          <StatCard title="Top Model" value="SVM" description="Selected for its consistent real-time accuracy" />
          <StatCard title="Alert Events" value="3" description="Recent fatigue warnings in the session" />
        </div>
        <div className="flex-1 glass neon p-4">
          <h3 className="text-lg font-semibold mb-3">Real-time EEG Simulation</h3>
          <LiveStreamChart />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="glass neon p-6">
          <h3 className="text-lg font-semibold mb-3">Prediction health</h3>
          <div className="h-60 rounded-xl bg-black/20" />
        </div>
        <div className="glass neon p-6">
          <h3 className="text-lg font-semibold mb-3">Explainability preview</h3>
          <ul className="space-y-3 text-slate-300">
            <li className="rounded-xl bg-black/20 p-4">Permutation Entropy - top influence</li>
            <li className="rounded-xl bg-black/20 p-4">Sample Entropy - strong fatigue indicator</li>
            <li className="rounded-xl bg-black/20 p-4">PSD Beta - signal activity importance</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
