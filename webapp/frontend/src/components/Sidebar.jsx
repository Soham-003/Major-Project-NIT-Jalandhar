import React from 'react'
import { NavLink } from 'react-router-dom'

const items = [
  {to:'/',label:'Dashboard'},
  {to:'/predict',label:'Predict Fatigue'},
  {to:'/analytics',label:'EEG Analytics'},
  {to:'/models',label:'Model Performance'},
  {to:'/about',label:'About'},
]

export default function Sidebar(){
  return (
    <aside className="w-64 p-6 bg-black/40 glass neon" style={{minHeight:'100vh'}}>
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">EEG Driver AI</h1>
        <p className="text-xs text-slate-300">Futuristic fatigue detection</p>
      </div>
      <nav className="flex flex-col gap-2">
        {items.map(i=> (
          <NavLink key={i.to} to={i.to} className={({isActive})=> `block px-3 py-2 rounded ${isActive? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-black':'text-slate-300 hover:bg-white/5'}`}>
            {i.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-8 text-xs text-slate-400">Connected: <span className="text-green-400">Backend</span></div>
    </aside>
  )
}
