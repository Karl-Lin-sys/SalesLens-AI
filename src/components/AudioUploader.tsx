import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, Loader2, Mic, Square } from 'lucide-react';
import { cn } from '../lib/utils';

interface AudioUploaderProps {
  onUploadSuccess: (data: any) => void;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
}

export function AudioUploader({ onUploadSuccess, isUploading, setIsUploading }: AudioUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const processAudioBlob = async (blob: Blob, filename: string) => {
    setError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('audio', blob, filename);

    try {
      const response = await fetch('/api/analyze-call', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      onUploadSuccess(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to process audio.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|ogg|webm)$/i)) {
      setError('Please select a valid audio file (mp3, wav, m4a, ogg, webm).');
      return;
    }
    processAudioBlob(file, file.name);
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        processAudioBlob(audioBlob, 'recording.webm');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  if (isUploading) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="border-2 border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center bg-white shadow-sm text-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <p className="text-lg font-medium text-slate-700">Analyzing Sales Call...</p>
          <p className="text-sm text-slate-500 mt-2">This may take a minute or two using Gemini AI.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Upload Box */}
        <div
          className={cn(
            "relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors duration-200 text-center cursor-pointer",
            dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-slate-400 bg-white"
          )}
          onDragEnter={onDrag}
          onDragLeave={onDrag}
          onDragOver={onDrag}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleChange}
          />
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-blue-600">
            <UploadCloud size={24} />
          </div>
          <p className="text-base font-medium text-slate-800 mb-1">Upload Recording</p>
          <p className="text-sm text-slate-500 mb-3">Drag & drop or click</p>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <FileAudio size={14} />
            <span>MP3, WAV, M4A</span>
          </div>
        </div>

        {/* Record Box */}
        <div className="border-2 border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-white transition-colors duration-200 text-center">
          {!isRecording ? (
            <>
              <button 
                onClick={startRecording}
                className="h-16 w-16 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center mb-4 text-red-600 transition-colors focus:outline-none focus:ring-4 focus:ring-red-100"
              >
                <Mic size={28} />
              </button>
              <p className="text-base font-medium text-slate-800 mb-1">Record Audio</p>
              <p className="text-sm text-slate-500">Capture a live conversation</p>
            </>
          ) : (
            <>
              <button 
                onClick={stopRecording}
                className="h-16 w-16 rounded-full bg-slate-900 hover:bg-slate-800 flex items-center justify-center mb-4 text-white transition-colors animate-pulse focus:outline-none focus:ring-4 focus:ring-slate-200"
              >
                <Square size={24} fill="currentColor" />
              </button>
              <p className="text-base font-medium text-red-600 mb-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                Recording Live
              </p>
              <p className="text-2xl font-mono text-slate-700 tracking-wider">
                {formatTime(recordingTime)}
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
