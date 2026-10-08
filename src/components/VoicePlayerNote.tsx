import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, Download, Mic } from 'lucide-react';
import { downloadAudio } from '../utils/download';

interface VoicePlayerNoteProps {
  audioUrl: string;
  durationSeconds?: number;
  authorName?: string;
  timestamp?: string;
}

export const VoicePlayerNote: React.FC<VoicePlayerNoteProps> = ({
  audioUrl,
  durationSeconds = 15,
  authorName,
  timestamp
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlayback = () => {
    if (!audioRef.current) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleDownload = () => {
    downloadAudio(audioUrl, `voice-note-${Date.now()}.webm`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-3 space-y-2 shadow-sm my-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Mic className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200">
              Voice Note Telemetry ({durationSeconds}s)
            </span>
            {authorName && (
              <span className="text-[10px] text-slate-400 block">
                Recorded by {authorName} {timestamp ? `• ${timestamp}` : ''}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          title="Download Voice Recording"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-lg border border-slate-800/80">
        <button
          type="button"
          onClick={togglePlayback}
          className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>

        {/* Waveform graphic */}
        <div className="flex-1 flex items-center gap-1 h-4 px-1 overflow-hidden">
          {[40, 70, 90, 50, 100, 30, 80, 60, 95, 40, 85, 55, 75, 35, 90, 45, 65, 80].map((h, i) => (
            <div
              key={i}
              style={{ height: `${h}%` }}
              className={`w-1 rounded-full transition-colors ${
                isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
          00:{durationSeconds < 10 ? `0${durationSeconds}` : durationSeconds}
        </span>
      </div>
    </div>
  );
};
