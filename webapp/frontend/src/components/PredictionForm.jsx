import React, {useState} from 'react'
import axios from 'axios'
import PredictionResult from './PredictionResult'
import { API_ENDPOINTS } from '../config'

export default function PredictionForm(){
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const submitFile = async ()=>{
    if(!file) return alert('Upload CSV')
    setLoading(true)
    try{
      const fd = new FormData()
      fd.append('file', file)
      const res = await axios.post(API_ENDPOINTS.PREDICT, fd, {headers:{'Content-Type':'multipart/form-data'}})
      setResult(res.data)
    }catch(e){
      setResult({error: e.response?.data?.error || e.message})
    }
    setLoading(false)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        <section className="p-6 glass neon">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">File Upload</h3>
              <p className="text-xs text-slate-400">Upload a prepared EEG feature CSV and get instant prediction.</p>
            </div>
            <a href={API_ENDPOINTS.DEMO_SAMPLE} className="text-xs text-cyan-300 hover:text-cyan-100">Download sample</a>
          </div>
          <input className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white" type="file" accept=".csv" onChange={e=> setFile(e.target.files[0])} />
          <button className="mt-5 inline-flex items-center justify-center rounded-2xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400" onClick={submitFile}>
            {loading? 'Uploading & analyzing...' : 'Upload CSV'}
          </button>
        </section>
      </div>

      <section className="p-6 glass neon">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Prediction Output</h3>
            <p className="text-xs text-slate-400">Live results from the selected backend model.</p>
          </div>
          {loading && <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">Processing</span>}
        </div>
        <PredictionResult result={result} />
      </section>
    </div>
  )
}
