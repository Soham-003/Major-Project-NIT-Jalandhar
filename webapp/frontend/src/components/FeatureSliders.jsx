import React from 'react';

const FEATURE_CONFIG = [
  { key: 'Attention', label: 'Attention Level', min: 1, max: 100, step: 1 },
  { key: 'Meditation', label: 'Meditation Level', min: 1, max: 100, step: 1 },
  { key: 'BlinkStrength', label: 'Blink Strength', min: 0, max: 255, step: 1 },
  { key: 'Delta', label: 'Delta Waves (1-3Hz)', min: 0, max: 2000000, step: 1000 },
  { key: 'Theta', label: 'Theta Waves (4-7Hz)', min: 0, max: 2000000, step: 1000 },
  { key: 'AlphaLow', label: 'Low Alpha (8-9Hz)', min: 0, max: 100000, step: 100 },
  { key: 'AlphaHigh', label: 'High Alpha (10-12Hz)', min: 0, max: 100000, step: 100 },
  { key: 'BetaLow', label: 'Low Beta (13-17Hz)', min: 0, max: 100000, step: 100 },
  { key: 'BetaHigh', label: 'High Beta (18-30Hz)', min: 0, max: 100000, step: 100 },
  { key: 'GammaLow', label: 'Low Gamma (31-40Hz)', min: 0, max: 100000, step: 100 },
  { key: 'GammaMid', label: 'Mid Gamma (41-50Hz)', min: 0, max: 100000, step: 100 },
  { key: 'SignalQuality', label: 'Signal Noise (0=Good)', min: 0, max: 200, step: 1 },
];

export default function FeatureSliders({ features, setFeatures, disabled }) {
  
  const handleChange = (key, val) => {
    setFeatures(prev => ({ ...prev, [key]: parseFloat(val) }));
  };

  const setRandom = () => {
    const newFeatures = {};
    FEATURE_CONFIG.forEach(c => {
      // Generate realistic random within bounds
      const range = c.max - c.min;
      let val = c.min + (Math.random() * range * 0.4); // biased towards lower end mostly
      if (c.key === 'Attention' || c.key === 'Meditation') val = 40 + Math.random() * 40;
      if (c.key === 'SignalQuality') val = Math.random() > 0.9 ? 200 : 0;
      newFeatures[c.key] = parseFloat(val.toFixed(2));
    });
    setFeatures(newFeatures);
  };

  return (
    <div className="space-y-4">
      {FEATURE_CONFIG.map((conf) => (
        <div key={conf.key} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300">{conf.label}</span>
            <span className="text-cyan-400 font-mono">{features[conf.key]?.toFixed(0) || 0}</span>
          </div>
          <input 
            type="range" 
            min={conf.min} 
            max={conf.max} 
            step={conf.step}
            value={features[conf.key] || 0}
            onChange={(e) => handleChange(conf.key, e.target.value)}
            disabled={disabled}
            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${disabled ? 'bg-slate-800' : 'bg-slate-700'}`}
            style={{
              background: disabled 
                ? 'rgb(30 41 59)' 
                : `linear-gradient(to right, rgb(6 182 212) ${((features[conf.key] || 0) - conf.min) / (conf.max - conf.min) * 100}%, rgb(51 65 85) 0)`
            }}
          />
        </div>
      ))}
      
      {!disabled && (
        <button 
          onClick={setRandom}
          className="w-full mt-4 py-2 border border-slate-700 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
        >
          Generate Random EEG Scan
        </button>
      )}
    </div>
  );
}
