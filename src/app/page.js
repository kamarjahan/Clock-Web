"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, AlarmClock, Hourglass, Timer, Play, Pause, RotateCcw, Bell, Trash2, Plus, X, BellRing, Eraser } from "lucide-react";

// --- Utility: Format IST Time ---
const formatIST = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
};

// --- Component: Digital Clock (IST) ---
const ClockView = () => {
  const [time, setTime] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(formatIST(now));
      setDateStr(new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(now));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const [timePart, ampm] = time.split(" ");
  
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="text-gray-400 text-lg uppercase tracking-widest font-medium mb-2">New Delhi (IST)</div>
        <div className="text-[12vh] sm:text-[18vh] font-mono leading-none tracking-tighter font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-2xl tabular-nums">
           {timePart || "00:00:00"}
           <span className="text-[4vh] ml-4 text-gray-500">{ampm}</span>
        </div>
        <div className="text-2xl text-cyan-300 font-light mt-4 tracking-wide">{dateStr}</div>
      </motion.div>
    </div>
  );
};

// --- Component: Alarm ---
const AlarmView = () => {
  const [alarms, setAlarms] = useState([]);
  const [newTime, setNewTime] = useState("");
  const [ringingAlarm, setRingingAlarm] = useState(null);
  const audioRef = useRef(null);
  const isLoaded = useRef(false);

  // 1. Load Alarms from Local Storage on Mount
  useEffect(() => {
    const savedAlarms = localStorage.getItem("swiftClock_alarms");
    if (savedAlarms) {
      try {
        setAlarms(JSON.parse(savedAlarms));
      } catch (e) {
        console.error("Failed to parse alarms");
      }
    }
    isLoaded.current = true;
    
    // Initialize Audio
    audioRef.current = new Audio("/alarm.mp3");
    audioRef.current.loop = true;
  }, []);

  // 2. Save Alarms to Local Storage whenever they change
  useEffect(() => {
    if (isLoaded.current) {
      localStorage.setItem("swiftClock_alarms", JSON.stringify(alarms));
    }
  }, [alarms]);

  // Check Alarms Loop
  useEffect(() => {
    const checkAlarm = setInterval(() => {
      const now = new Date();
      const currentTimeStr = new Intl.DateTimeFormat("en-US", {
         timeZone: "Asia/Kolkata", hour: '2-digit', minute:'2-digit', hour12: false 
      }).format(now);

      alarms.forEach(alarm => {
        if (alarm.isActive && alarm.time === currentTimeStr && !alarm.triggered && !ringingAlarm) {
          triggerAlarm(alarm);
        }
      });
    }, 1000);
    return () => clearInterval(checkAlarm);
  }, [alarms, ringingAlarm]);

  const triggerAlarm = async (alarm) => {
    setAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, triggered: true } : a));
    setRingingAlarm(alarm);
    try { await audioRef.current.play(); } catch (err) { console.error("Audio playback failed:", err); }
  };

  const stopRinging = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    if (ringingAlarm) {
        setAlarms(prev => prev.map(a => a.id === ringingAlarm.id ? { ...a, isActive: false } : a));
    }
    setRingingAlarm(null);
  };

  const addAlarm = () => {
    if (!newTime) return;
    setAlarms([...alarms, { id: Date.now(), time: newTime, isActive: true, triggered: false }]);
    setNewTime("");
  };

  const deleteAlarm = (id) => {
      setAlarms(alarms.filter(a => a.id !== id));
  };

  return (
    <>
      <div className="w-full max-w-md mx-auto h-[60vh] flex flex-col relative">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Bell className="w-6 h-6 text-cyan-400"/> Alarms</h2>
        
        <div className="flex gap-2 mb-6">
          <input 
            type="time" 
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white w-full focus:outline-none focus:border-cyan-500 transition"
          />
          <button onClick={addAlarm} className="bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-lg transition"><Plus /></button>
        </div>

        <div className="overflow-y-auto space-y-3 pr-2 scrollbar-hide pb-20">
          {alarms.length === 0 && <p className="text-gray-500 text-center mt-10">No alarms set</p>}
          {alarms.map(alarm => (
            <motion.div 
              key={alarm.id} 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl flex justify-between items-center glass border-l-4 ${alarm.isActive ? 'border-l-cyan-400' : 'border-l-gray-600'}`}
            >
              <span className="text-3xl font-mono">{alarm.time}</span>
              <div className="flex gap-3">
                <button 
                  onClick={() => setAlarms(alarms.map(a => a.id === alarm.id ? { ...a, isActive: !a.isActive, triggered: false } : a))}
                  className={`w-10 h-6 rounded-full relative transition-colors ${alarm.isActive ? "bg-cyan-600" : "bg-gray-600"}`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${alarm.isActive ? "translate-x-4" : ""}`} />
                </button>
                <button onClick={() => deleteAlarm(alarm.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-5 h-5"/></button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {ringingAlarm && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            >
                <motion.div 
                    initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                    className="bg-gray-900 border border-cyan-500/50 p-10 rounded-3xl flex flex-col items-center shadow-2xl shadow-cyan-500/20"
                >
                    <BellRing className="w-20 h-20 text-cyan-400 animate-bounce mb-6" />
                    <h2 className="text-4xl font-bold text-white mb-2">Alarm</h2>
                    <p className="text-2xl font-mono text-cyan-200 mb-8">{ringingAlarm.time}</p>
                    <button onClick={stopRinging} className="bg-cyan-600 hover:bg-cyan-500 text-white text-xl font-bold py-4 px-12 rounded-full shadow-lg transition transform hover:scale-105">
                        Stop
                    </button>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// --- Component: Timer ---
const TimerView = () => {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [inputVal, setInputVal] = useState({ h:0, m:0, s:0 });
  const [isFinished, setIsFinished] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
     audioRef.current = new Audio("/alarm.mp3");
     audioRef.current.loop = true;
  }, []);

  useEffect(() => {
    let interval;
    if (isRunning && totalSeconds > 0) {
      interval = setInterval(() => setTotalSeconds(t => t - 1), 1000);
    } else if (totalSeconds === 0 && isRunning) {
      setIsRunning(false);
      setIsFinished(true);
      audioRef.current.play().catch(e => console.error(e));
    }
    return () => clearInterval(interval);
  }, [isRunning, totalSeconds]);

  const startTimer = () => {
    if (!isRunning && totalSeconds === 0) {
        const secs = (parseInt(inputVal.h || 0) * 3600) + (parseInt(inputVal.m || 0) * 60) + parseInt(inputVal.s || 0);
        if (secs > 0) setTotalSeconds(secs);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTotalSeconds(0);
    setIsFinished(false);
    if(audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
  };

  const stopRinging = () => {
      setIsFinished(false);
      if(audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
  };

  const formatTime = (total) => {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
        <div className="flex flex-col items-center justify-center h-full">
            {totalSeconds === 0 && !isRunning && !isFinished ? (
                <div className="flex gap-4 mb-10 text-center">
                    {['h','m','s'].map((unit) => (
                        <div key={unit} className="flex flex-col">
                            <input 
                                type="number" min="0" max="60" 
                                className="bg-transparent text-5xl font-mono text-center w-24 border-b-2 border-gray-600 focus:border-cyan-400 outline-none pb-2 text-white placeholder-gray-700"
                                placeholder="00"
                                onChange={(e) => setInputVal({...inputVal, [unit]: e.target.value})}
                            />
                            <span className="text-gray-500 uppercase text-xs mt-2">{unit === 'h' ? 'Hours' : unit === 'm' ? 'Minutes' : 'Seconds'}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-[15vw] sm:text-[120px] font-mono font-bold tabular-nums mb-8 tracking-tighter text-cyan-100 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                    {formatTime(totalSeconds)}
                </div>
            )}

            <div className="flex gap-6">
                <button onClick={startTimer} className="p-4 rounded-full bg-cyan-600 hover:bg-cyan-500 transition shadow-lg hover:shadow-cyan-500/20 text-white">
                    {isRunning ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                </button>
                <button onClick={resetTimer} className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition shadow-lg text-white">
                    <RotateCcw className="w-8 h-8" />
                </button>
            </div>
        </div>

        <AnimatePresence>
            {isFinished && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
                >
                    <motion.div 
                        initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                        className="bg-gray-900 border border-cyan-500/50 p-10 rounded-3xl flex flex-col items-center shadow-2xl"
                    >
                        <Hourglass className="w-20 h-20 text-cyan-400 animate-spin-slow mb-6" />
                        <h2 className="text-4xl font-bold text-white mb-8">Time's Up!</h2>
                        <button onClick={stopRinging} className="bg-cyan-600 hover:bg-cyan-500 text-white text-xl font-bold py-4 px-12 rounded-full shadow-lg transition transform hover:scale-105">
                            Stop
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </>
  );
};

// --- Component: Stopwatch ---
const StopwatchView = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState([]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => setTime(prev => prev + 10), 10);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (ms) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const millis = Math.floor((ms % 1000) / 10);
    return (
        <div className="flex items-baseline text-white">
            <span className="w-[1.2ch]">{mins.toString().padStart(2, '0')}</span>:
            <span className="w-[1.2ch]">{secs.toString().padStart(2, '0')}</span>.
            <span className="text-6xl text-cyan-400 w-[1.2ch]">{millis.toString().padStart(2, '0')}</span>
        </div>
    );
  };

  return (
    <div className="flex flex-col items-center h-full w-full max-w-2xl mx-auto">
      <div className="text-[12vw] sm:text-[120px] font-mono font-bold tabular-nums my-4 tracking-tighter">
        {formatTime(time)}
      </div>

      <div className="flex gap-6 mb-8">
        <button onClick={() => setIsRunning(!isRunning)} className={`p-6 rounded-full transition shadow-lg text-white ${isRunning ? 'bg-red-500/80 hover:bg-red-500' : 'bg-green-500/80 hover:bg-green-500'}`}>
           {isRunning ? <Pause className="w-8 h-8 fill-current"/> : <Play className="w-8 h-8 fill-current ml-1"/>}
        </button>
        <button onClick={() => { setIsRunning(false); setTime(0); setLaps([]); }} className="p-6 rounded-full bg-gray-700 hover:bg-gray-600 transition text-white">
            <RotateCcw className="w-8 h-8"/>
        </button>
        {isRunning && (
            <button onClick={() => setLaps([time, ...laps])} className="p-6 rounded-full bg-cyan-600 hover:bg-cyan-500 transition text-white">
                <Plus className="w-8 h-8"/>
            </button>
        )}
      </div>

      <div className="w-full max-h-[30vh] overflow-y-auto pr-2 space-y-2 scrollbar-hide">
          {laps.map((lap, i) => (
              <div key={i} className="flex justify-between items-center p-3 glass rounded-lg text-lg font-mono text-gray-300">
                  <span>Lap {laps.length - i}</span>
                  <span>{Math.floor(lap / 60000).toString().padStart(2,'0')}:{Math.floor((lap % 60000)/1000).toString().padStart(2,'0')}.{Math.floor((lap % 1000)/10).toString().padStart(2,'0')}</span>
              </div>
          ))}
      </div>
    </div>
  );
};

// --- Main Page Layout ---
export default function Home() {
  const [activeTab, setActiveTab] = useState("clock");
  
  const tabs = [
    { id: "clock", label: "Clock", icon: Clock },
    { id: "alarm", label: "Alarm", icon: AlarmClock },
    { id: "timer", label: "Timer", icon: Hourglass },
    { id: "stopwatch", label: "Stopwatch", icon: Timer },
  ];

  // --- NEW: Clear Cache/Reset Function ---
  const handleClearCache = () => {
    if (confirm("⚠️ Are you sure? This will delete all alarms and reset the app.")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center relative bg-hero-pattern bg-cover bg-center">
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/70 z-0" />
      
      {/* Content Container */}
      <div className="relative z-10 w-full h-screen flex flex-col md:flex-row overflow-hidden">
        
        {/* Navigation Sidebar/Bottombar */}
        <nav className="glass-panel w-full md:w-24 md:h-full h-24 flex md:flex-col justify-between items-center py-4 z-20 order-2 md:order-1 px-4 md:px-0">
          
          {/* Tabs Section */}
          <div className="flex md:flex-col gap-6 justify-center w-full">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative group p-3 rounded-2xl transition-all duration-300 ${isActive ? "bg-cyan-500/20 text-cyan-400" : "text-gray-400 hover:text-white"}`}
                >
                    <Icon strokeWidth={isActive ? 2.5 : 1.5} className="w-8 h-8" />
                    {isActive && (
                    <motion.div layoutId="bubble" className="absolute inset-0 border-2 border-cyan-500/30 rounded-2xl" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                    )}
                    <span className="absolute left-full ml-4 px-2 py-1 bg-black/80 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block border border-gray-700 pointer-events-none">
                        {tab.label}
                    </span>
                </button>
                );
            })}
          </div>

          {/* Reset Button (Separated at bottom/right) */}
          <div className="border-t md:border-t-0 md:border-t border-gray-700/50 pt-2 md:pt-4 w-full flex justify-center">
            <button 
                onClick={handleClearCache}
                className="group relative p-3 rounded-2xl text-red-500/70 hover:bg-red-500/20 hover:text-red-400 transition-all duration-300"
            >
                <Eraser className="w-6 h-6" />
                <span className="absolute left-full ml-4 px-2 py-1 bg-red-900/80 text-red-100 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block border border-red-700 pointer-events-none">
                    Reset App
                </span>
            </button>
          </div>

        </nav>

        {/* Main Display Area */}
        <div className="flex-1 h-full relative flex items-center justify-center p-6 order-1 md:order-2">
           {/* Background decorative glow */}
           <div className="absolute w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />
           
           <div className="w-full max-w-4xl h-full flex items-center justify-center">
             <AnimatePresence mode="wait">
               <motion.div
                 key={activeTab}
                 initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                 animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                 exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                 transition={{ duration: 0.4, ease: "easeOut" }}
                 className="w-full"
               >
                 {activeTab === "clock" && <ClockView />}
                 {activeTab === "alarm" && <AlarmView />}
                 {activeTab === "timer" && <TimerView />}
                 {activeTab === "stopwatch" && <StopwatchView />}
               </motion.div>
             </AnimatePresence>
           </div>
        </div>
      </div>
    </main>
  );
}