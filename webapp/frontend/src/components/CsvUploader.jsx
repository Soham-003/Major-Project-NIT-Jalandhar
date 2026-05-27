import React, { useRef, useState } from 'react';
import { UploadCloud, File, X, Download } from 'lucide-react';
import { API_ENDPOINTS } from '../config';

export default function CsvUploader({ onFileUpload, isScanning }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    // Check if it's a CSV
    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      alert("Please upload a valid CSV file.");
      return;
    }
    setSelectedFile(file);
  };

  const submitFile = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-slate-900/50 border border-white/5 rounded-2xl">
        <div className="text-sm text-slate-300">
          Need sample data?
        </div>
        <a 
          href={API_ENDPOINTS.DEMO_SAMPLE}
          download="sample_input.csv"
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold rounded-lg transition-colors border border-cyan-500/20"
        >
          <Download className="w-4 h-4" />
          Download Sample EEG Data
        </a>
      </div>

      <div 
        className={`relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-colors min-h-[250px]
          ${dragActive ? 'border-cyan-400 bg-cyan-400/5' : 'border-slate-700 bg-slate-900/30 hover:bg-slate-900/50'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleChange}
          className="hidden"
          id="file-upload"
        />

        {!selectedFile ? (
          <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer text-center space-y-4">
            <div className="p-4 bg-slate-800 rounded-full">
              <UploadCloud className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <p className="text-slate-200 font-medium text-lg">Click to upload or drag and drop</p>
              <p className="text-slate-500 text-sm mt-1">CSV columns: Attention, Meditation, BlinkStrength, Delta, Theta, AlphaLow, AlphaHigh, BetaLow, BetaHigh, GammaLow, GammaMid, SignalQuality</p>
            </div>
          </label>
        ) : (
          <div className="flex flex-col items-center space-y-6 w-full">
            <div className="flex items-center gap-4 bg-slate-800/80 p-4 rounded-2xl w-full border border-slate-700">
              <File className="w-8 h-8 text-cyan-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-slate-500 text-xs">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={clearFile} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-rose-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <button 
              onClick={submitFile}
              disabled={isScanning}
              className={`w-full py-3 rounded-xl font-bold tracking-wide transition-all
                ${isScanning 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)]'}`}
            >
              {isScanning ? 'Processing Signals...' : 'Analyze CSV'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
