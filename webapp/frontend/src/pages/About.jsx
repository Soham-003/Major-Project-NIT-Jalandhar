import React from 'react'
import { API_ENDPOINTS } from '../config'

export default function About(){
  return (
    <div className="space-y-6">
      <section className="glass neon p-6">
        <h2 className="text-2xl font-bold mb-3">About this Project</h2>
        <p className="text-slate-300">This dashboard presents an EEG-based driver fatigue detection system that combines brainwave feature extraction with machine learning models (SVM, Random Forest, KNN, MLP).</p>
        <p className="text-slate-300">Upload EEG feature data or use the sample dataset to demonstrate real predictions during your presentation.</p>
      </section>
      <section className="glass neon p-6 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold mb-2">Research</h3>
          <p className="text-slate-300 text-sm">Based on the PLOS ONE paper on multiple entropy fusion for fatigue detection, this project uses entropy features, PSD values, mean/std, and trained classifiers to determine driver alertness.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Demo ready</h3>
          <p className="text-slate-300 text-sm">The backend includes a sample CSV endpoint for quick demonstrations. The frontend connects directly to the prediction API.</p>
        </div>
      </section>
      <section className="glass neon p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Run instructions</h3>
            <p className="text-slate-300 text-sm">Start the Flask backend then run the React app to access the dashboard and prediction tools.</p>
          </div>
          <a href={API_ENDPOINTS.DEMO_SAMPLE} className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-black">Download sample CSV</a>
        </div>
      </section>
    </div>
  )
}
