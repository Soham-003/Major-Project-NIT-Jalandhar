import React from 'react'
import BrainwaveCanvas from '../components/BrainwaveCanvas'
import { motion } from 'framer-motion'

export default function Landing(){
  return (
    <div className="grid gap-6">
      <section className="p-6 glass neon">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">EEG-Based Driver Fatigue Detection System</h2>
            <p className="text-slate-300 mt-2">AI + EEG + Machine Learning for real-time driver state monitoring</p>
            <div className="mt-4 flex gap-3">
              <a href="/predict" className="px-4 py-2 bg-cyan-500 rounded">Start Detection</a>
              <a href="/models" className="px-4 py-2 bg-violet-600 rounded">View Model Performance</a>
            </div>
          </div>
          <div style={{width:420}}>
            <BrainwaveCanvas />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-4">
        <motion.div className="p-4 glass neon" whileHover={{scale:1.02}}>
          <h4 className="font-semibold">Realtime Simulation</h4>
          <p className="text-xs text-slate-300">Animated EEG stream for demo</p>
        </motion.div>
        <motion.div className="p-4 glass neon" whileHover={{scale:1.02}}>
          <h4 className="font-semibold">Explainability</h4>
          <p className="text-xs text-slate-300">Feature influence and important electrodes</p>
        </motion.div>
        <motion.div className="p-4 glass neon" whileHover={{scale:1.02}}>
          <h4 className="font-semibold">Models</h4>
          <p className="text-xs text-slate-300">Compare SVM, RF, KNN, MLP</p>
        </motion.div>
      </section>
    </div>
  )
}
