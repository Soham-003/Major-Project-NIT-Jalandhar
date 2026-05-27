import React, {useEffect, useState} from 'react'
import { Line } from 'react-chartjs-2'
import '../components/ChartSetup'

const generatePoints = (count, phase)=> Array.from({length: count}, (_,i)=> Math.sin((i*0.2)+phase) * 0.4 + Math.sin((i*0.05)+phase*1.2)*0.3)

export default function LiveStreamChart(){
  const [phase, setPhase] = useState(0)
  const [data, setData] = useState({labels:Array.from({length:50},(_,i)=>i), datasets:[{label:'EEG channel', data:generatePoints(50,0), borderColor:'#38bdf8', backgroundColor:'rgba(56,189,248,0.15)', tension:0.4}]})

  useEffect(()=>{
    const interval = setInterval(()=>{
      setPhase(p=>{
        const next = p + 0.2
        const values = generatePoints(50,next)
        setData(prev=> ({...prev, datasets:[{...prev.datasets[0], data: values}]}))
        return next
      })
    },120)
    return ()=> clearInterval(interval)
  },[])

  return (
    <div className="glass neon p-4">
      <div className="mb-3 text-sm text-slate-300">Live EEG stream</div>
      <Line data={data} options={{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}}} height={220}/>
    </div>
  )
}
