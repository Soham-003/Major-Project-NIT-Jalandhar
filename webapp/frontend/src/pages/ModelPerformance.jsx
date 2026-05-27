import React, {useEffect, useState} from 'react'
import axios from 'axios'
import '../components/ChartSetup'
import { Bar } from 'react-chartjs-2'
import { API_ENDPOINTS } from '../config'

const sampleData = {
  labels: ['SVM', 'Random Forest', 'KNN', 'MLP'],
  datasets: [{
    label: 'Validation Accuracy',
    data: [0.998, 1.0, 0.9825, 0.9945],
    backgroundColor: ['#06b6d4', '#8b5cf6', '#a855f7', '#38bdf8'],
  }]
}

export default function ModelPerformance(){
  const [models, setModels] = useState([])
  useEffect(()=>{
    axios.get(API_ENDPOINTS.MODELS).then(r=> setModels(r.data.models || [])).catch(e=> console.error('Failed to load models:', e))
  },[])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Model Performance</h2>
        <p className="text-slate-300">Compare model accuracy and confidence across all trained classifiers.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass neon p-6">
          <h3 className="text-lg font-semibold mb-4">Accuracy comparison</h3>
          <Bar data={sampleData} options={{responsive:true, plugins:{legend:{display:false}}}} />
        </div>
        <div className="space-y-4">
          {models.map((m, idx)=>(
            <div key={idx} className="p-4 glass neon">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{m.name}</div>
                  <div className="text-xs text-slate-300">{m.estimator || 'unknown'}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Score</div>
                  <div className="font-semibold text-white">{m.score? m.score.toFixed(4): 'N/A'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
