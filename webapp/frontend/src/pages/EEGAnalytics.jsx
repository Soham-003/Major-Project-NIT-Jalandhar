import React from 'react'
import '../components/ChartSetup'
import { Line, Bar } from 'react-chartjs-2'
import BrainwaveCanvas from '../components/BrainwaveCanvas'

const eegData = {
  labels: ['0','1','2','3','4','5','6','7','8','9','10'],
  datasets: [{ label:'EEG signal', data:[0.1,0.3,0.2,0.6,0.4,0.5,0.3,0.35,0.2,0.4,0.25], borderColor:'#38bdf8', backgroundColor:'rgba(56,189,248,0.16)', tension:0.4 }]
}

const entropyData = {
  labels:['PE','AE','SE','FE','PSD Alpha','PSD Beta'],
  datasets:[{ label:'Entropy values', data:[0.23,0.45,0.32,0.28,0.12,0.05], backgroundColor:['#0ea5e9','#7c3aed','#38bdf8','#a855f7','#22d3ee','#818cf8'] }]
}

export default function EEGAnalytics(){
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">EEG Analytics</h2>
        <p className="text-slate-300">Interactive analysis of brainwave features, entropy, and model-relevant signal patterns.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="glass neon p-6">
          <h3 className="text-lg font-semibold mb-4">Live EEG waveform</h3>
          <BrainwaveCanvas />
        </div>
        <div className="glass neon p-6">
          <h3 className="text-lg font-semibold mb-4">Entropy comparison</h3>
          <Bar data={entropyData} options={{responsive:true, plugins:{legend:{display:false}}}} />
        </div>
      </div>
      <div className="glass neon p-6">
        <h3 className="text-lg font-semibold mb-4">EEG signal history</h3>
        <div className="h-72"><Line data={eegData} options={{responsive:true, plugins:{legend:{display:false}}}} /></div>
      </div>
    </div>
  )
}
