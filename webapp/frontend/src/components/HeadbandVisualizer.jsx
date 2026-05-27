import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, Battery } from 'lucide-react';

export default function HeadbandVisualizer({ mode, isScanning }) {
  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]">
      
      {/* Background glow when scanning */}
      {isScanning && (
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full"
        />
      )}

      {/* Top Status indicators */}
      <div className="absolute top-4 w-full px-6 flex justify-between items-center text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <Wifi className={`w-3 h-3 ${mode === 'live' ? 'text-green-400' : 'text-slate-500'}`} />
          {mode === 'live' ? 'STREAMING' : 'OFFLINE'}
        </div>
        <div className="flex items-center gap-2">
          98% <Battery className="w-3 h-3 text-green-400" />
        </div>
      </div>

      {/* Headband Graphic */}
      <div className="relative mt-4">
        {/* Abstract Head Shape */}
        <div className="w-32 h-40 border-2 border-slate-800 rounded-[3rem] relative opacity-50"></div>
        
        {/* The Headband */}
        <motion.div 
          className="absolute top-12 -left-4 w-40 h-8 bg-slate-800 rounded-full border border-slate-700 shadow-xl flex items-center justify-center gap-4 z-10"
          animate={{ y: isScanning ? [0, -2, 0] : 0 }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Sensors */}
          <div className="w-2 h-2 rounded-full bg-slate-600"></div>
          <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${mode === 'live' ? 'bg-cyan-400 shadow-cyan-400/50' : 'bg-rose-500'}`}></div>
          <div className="w-2 h-2 rounded-full bg-slate-600"></div>
          
          {/* Sensor scanning beam */}
          {isScanning && (
            <motion.div 
              className="absolute top-full left-1/2 w-32 h-24 -translate-x-1/2 bg-gradient-to-b from-cyan-500/20 to-transparent clip-path-beam"
              style={{ clipPath: 'polygon(20% 0, 80% 0, 100% 100%, 0% 100%)' }}
              animate={{ opacity: [0.3, 0.7, 0.3], scaleY: [0.9, 1.1, 0.9] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </motion.div>

        {/* Floating particles for live mode */}
        {mode === 'live' && (
          <div className="absolute inset-0 z-0">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400 rounded-full"
                initial={{ x: 60, y: 50, opacity: 0 }}
                animate={{ 
                  y: [50, 0, -20],
                  x: 60 + (Math.random() * 40 - 20),
                  opacity: [0, 1, 0] 
                }}
                transition={{ 
                  duration: 2 + Math.random(), 
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 text-center z-10">
        <h3 className="text-white font-medium">NeuroSky Gen-2</h3>
        <p className="text-xs text-slate-400 mt-1">Status: {mode === 'live' ? 'Capturing EEG' : 'Standby'}</p>
      </div>

    </div>
  );
}
