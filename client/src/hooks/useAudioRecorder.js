// client/src/hooks/useAudioRecorder.js
import { useState, useRef } from 'react';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    if (isRecording) return;
    setError(null);

    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      setError("Microphone not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      let mimeType = 'audio/webm';
      const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/wav'
      ];

      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        setError("Recording error occurred.");
        stopTracks();
        setIsRecording(false);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
    } catch (err) {
      console.warn("Microphone access error:", err);
      setError("Microphone access denied.");
      setIsRecording(false);
    }
  };

  const stopTracks = () => {// Stop all tracks to release the microphone
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const stopRecording = () => {
    return new Promise((resolve, reject) => {
      if (!isRecording || !mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        setIsRecording(false);
        const chunks = audioChunksRef.current;
        let blobType = chunks[0]?.type || "audio/webm";
        const audioBlob = new Blob(chunks, { type: blobType });

        stopTracks();

        if (audioBlob.size < 1000) {
          reject(new Error("Recording too short. Try again."));
          return;
        }

        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
    });
  };

  return { isRecording, startRecording, stopRecording, error };
}
