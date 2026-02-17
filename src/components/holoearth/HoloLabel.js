import React, { useState } from 'react';

const HoloLabel = ({ 
    layerIndex = 0, 
    onNext = () => {}, 
    showButton = true, 
    isLast = false,
    alignment = 'right',
    onSend = () => {},
    isSent = false
}) => {
  const isRight = alignment === 'right';
  const [inputValue, setInputValue] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e) => {
    e.stopPropagation();
    if (!inputValue) return; // simple validation

    setIsSaved(true);
    
    // Slight delay for effect. 
    // We do NOT call onNext() automatically anymore, user must scroll manually.
    // We only call onSend() if it is the last layer to trigger the Core Override.
    setTimeout(() => {
        if (isLast && onSend) {
            onSend();
        }
    }, 400);
  };

  return (
    <div className={`select-none flex items-center ${isRight ? 'flex-row' : 'flex-row-reverse'} group`}>
      {/* Connecting Line */}
      <div className={`bg-cyan-400 opacity-70 shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all duration-300 ${isRight ? 'mr-0 origin-left' : 'ml-0 origin-right'}`} style={{width: 'clamp(2rem, 5vw, 4rem)', height: '0.125rem'}}></div>
      
      {/* Main Card */}
      <div className={`relative bg-[#0f0716] backdrop-blur-md border border-cyan-500/50 rounded-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all duration-300 ${isRight ? 'text-left' : 'text-right'}`} style={{padding: 'clamp(1rem, 2vw, 1.5rem)', width: 'clamp(15rem, 40vw, 25rem)'}}>
        
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 border-t-2 border-l-2 border-cyan-400" style={{width: 'clamp(0.5rem, 1vw, 1rem)', height: 'clamp(0.5rem, 1vw, 1rem)'}}></div>
        <div className="absolute top-0 right-0 border-t-2 border-r-2 border-cyan-400" style={{width: 'clamp(0.5rem, 1vw, 1rem)', height: 'clamp(0.5rem, 1vw, 1rem)'}}></div>
        <div className="absolute bottom-0 left-0 border-b-2 border-l-2 border-cyan-400" style={{width: 'clamp(0.5rem, 1vw, 1rem)', height: 'clamp(0.5rem, 1vw, 1rem)'}}></div>
        <div className="absolute bottom-0 right-0 border-b-2 border-r-2 border-cyan-400" style={{width: 'clamp(0.5rem, 1vw, 1rem)', height: 'clamp(0.5rem, 1vw, 1rem)'}}></div>

        {/* Header */}
        <div className={`flex items-center border-b border-cyan-500/30 ${isRight ? 'justify-between' : 'flex-row-reverse justify-between'}`} style={{marginBottom: 'clamp(0.5rem, 1vw, 1rem)', paddingBottom: 'clamp(0.25rem, 0.5vw, 0.5rem)'}}>
          <span className="text-cyan-400 font-bold tracking-widest uppercase" style={{fontSize: 'max(11px, 0.5vw)'}}>
            {`LAYER_0${layerIndex + 1} // INPUT`}
          </span>
          <span className="text-orange-400 animate-pulse" style={{fontSize: 'max(13px, 0.6vw)'}}>
            {isSent ? '● LOCKED' : showButton ? '● EDITING' : '● STANDBY'}
          </span>
        </div>

        {/* Content */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 'clamp(0.75rem, 1.5vw, 1.5rem)'}}>
           
           {/* Form Input */}
           <div className={`flex flex-col ${isRight ? 'items-start' : 'items-end'}`} style={{gap: 'clamp(0.25rem, 0.5vw, 0.5rem)'}}>
               <label className="text-cyan-200/70 font-mono tracking-wider" style={{fontSize: 'max(11px, 0.5vw)'}}>
                   DATA_PARAM_{layerIndex + 1}:
               </label>
               <input 
                 type="text" 
                 disabled={isSent || !showButton || isSaved}
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 placeholder={isSent ? "ENCRYPTED" : "ENTER VALUE..."}
                 className={`w-full bg-cyan-950/30 border-b border-cyan-500/40 text-cyan-100 font-mono outline-none focus:border-cyan-300 focus:bg-cyan-900/50 transition-all placeholder-cyan-700 ${isRight ? 'text-left' : 'text-right'}`}
                 style={{fontSize: 'max(11px, 0.55vw)', padding: 'clamp(0.3rem, 0.5vw, 0.5rem) clamp(0.5rem, 1vw, 0.8rem)'}}
               />
           </div>
           
           {/* Action Buttons */}
           {showButton && !isSaved && !isSent && (
               <button 
                onClick={handleSave}
                disabled={!inputValue}
                className={`w-full bg-cyan-900/40 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 font-mono tracking-wider uppercase transition-colors duration-200 flex items-center group-hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isRight ? 'justify-start' : 'justify-end flex-row-reverse'}`}
               style={{marginTop: 'clamp(0.5rem, 1vw, 1rem)', padding: 'clamp(0.4rem, 0.7vw, 0.6rem) clamp(0.6rem, 1.2vw, 1rem)', gap: 'clamp(0.3rem, 0.5vw, 0.5rem)', fontSize: 'max(11px, 0.5vw)'}}
               >
                 <span>{isLast ? 'TRANSMIT' : 'SAVE DATA'}</span>
                 <span style={{fontSize: 'max(13px, 0.65vw)', lineHeight: '1'}}>›</span>
               </button>
           )}
           
           {(isSaved || isSent) && (
            <div className={`w-full font-mono border text-center ${isSent ? 'border-yellow-500/30 bg-yellow-900/20 text-yellow-400' : 'border-green-500/30 bg-green-900/20 text-green-400'}`} style={{marginTop: 'clamp(0.5rem, 1vw, 1rem)', padding: 'clamp(0.3rem, 0.5vw, 0.5rem)', fontSize: 'max(11px, 0.5vw)'}}>
                {isSent ? 'CORE OVERRIDE ACTIVE' : 'DATA SAVED'}
            </div>
           )}
        </div>

        {/* Glowing Background Effect */}
        <div className="absolute inset-0 bg-cyan-500/5 z-[-1] animate-pulse"></div>
      </div>
    </div>
  );
};

export default HoloLabel;
