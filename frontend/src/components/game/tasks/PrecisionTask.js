import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const PrecisionTask = ({ task, onSuccess, onFail }) => {
  const [value, setValue] = useState(50);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  
  const target = task.config?.target || 73;
  const tolerance = task.config?.tolerance || 0.5;

  const handleChange = (e) => {
    setValue(parseFloat(e.target.value));
    soundManager.playTick();
  };

  const handleSubmit = useCallback(() => {
    if (submitted) return;
    
    setSubmitted(true);
    soundManager.playClick();
    
    const diff = Math.abs(value - target);
    
    if (diff <= tolerance) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => {
        onSuccess();
        setValue(50);
        setSubmitted(false);
        setResult(null);
      }, 800);
    } else {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => {
        onFail();
        setValue(50);
        setSubmitted(false);
        setResult(null);
      }, 500);
    }
  }, [value, target, tolerance, submitted, onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="precision-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      
      {/* Value display */}
      <div 
        className="font-mono text-6xl font-bold"
        style={{ color: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A' }}
        data-testid="precision-value"
      >
        {value.toFixed(1)}
      </div>
      
      {/* Slider */}
      <div className="w-72 px-4">
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={value}
          onChange={handleChange}
          disabled={submitted}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #0F172A 0%, #0F172A ${value}%, #E2E8F0 ${value}%, #E2E8F0 100%)`
          }}
          data-testid="precision-slider"
        />
        <div className="flex justify-between mt-2 font-mono text-xs text-slate-400">
          <span>0</span>
          <span>100</span>
        </div>
      </div>
      
      {/* Submit button */}
      <motion.button
        className="px-8 py-3 rounded-full font-semibold touch-target"
        style={{
          backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A',
          color: 'white'
        }}
        onClick={handleSubmit}
        disabled={submitted}
        whileTap={{ scale: 0.95 }}
        data-testid="precision-submit"
      >
        {submitted ? (result === 'success' ? 'Perfect!' : `Target was ${target}`) : 'Lock In'}
      </motion.button>
      
      <p className="font-mono text-sm text-slate-400">
        Tolerance: ±{tolerance}
      </p>
    </div>
  );
};
