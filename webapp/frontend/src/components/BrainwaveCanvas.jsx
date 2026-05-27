import React, {useEffect, useRef} from 'react'

export default function BrainwaveCanvas(){
  const canvasRef = useRef()

  useEffect(()=>{
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.clientWidth * devicePixelRatio
    canvas.height = 150 * devicePixelRatio
    let t = 0
    const draw = ()=>{
      ctx.clearRect(0,0,canvas.width, canvas.height)
      ctx.lineWidth = 2 * devicePixelRatio
      // layered sine waves
      for(let i=0;i<3;i++){
        ctx.beginPath()
        ctx.strokeStyle = `rgba(${20+i*60},${200-i*80},255,${0.6 - i*0.15})`
        for(let x=0;x<canvas.width;x+=2){
          const xx = x / devicePixelRatio / 6
          const y = 75 + 40*Math.sin(0.02*xx*(i+1) + t*(i+1)) + (i*10)
          if(x===0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      t += 0.05
      requestAnimationFrame(draw)
    }
    draw()
  },[])

  return <canvas ref={canvasRef} style={{width:'100%', height:150, borderRadius:8}} className="bg-transparent" />
}
