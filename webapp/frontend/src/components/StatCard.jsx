import React from 'react'

export default function StatCard({title, value, description, accent='cyan'}){
  return (
    <div className="p-4 glass neon">
      <div className="text-xs uppercase text-slate-400 tracking-[0.2em]">{title}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-slate-300">{description}</div>
    </div>
  )
}
