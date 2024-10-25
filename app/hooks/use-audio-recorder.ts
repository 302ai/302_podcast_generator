import { useEffect, useMemo, useRef, useState } from 'react';
import Recorder from 'recorder-core';

require('recorder-core/src/engine/wav');

type RecorderStatus = 'Idle' | 'Recording' | 'Paused' | 'Stopped';

interface AudioRecorderHook {
  status: RecorderStatus;
  sampleRate: number;
  isRecording: boolean;
  setSampleRate: (rate: number) => void;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  stopWithData: () => Promise<Blob | null>;
  pause: () => void;
  resume: () => void;
  close: () => void;
  recordedBlob: Blob | null;
  recordingDuration: number;
  error: string | null;
}

const useAudioRecorder = (defaultSampleRate = 44100): AudioRecorderHook => {
  const [status, setStatus] = useState<RecorderStatus>('Idle');
  const [sampleRate, setSampleRate] = useState<number>(defaultSampleRate);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<typeof Recorder | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const durationRef = useRef<number>(0);

  const isRecording = useMemo(() => status === 'Recording', [status]);

  const createRecorder = () => {
    return new Recorder({
      type: 'wav',
      sampleRate,
      onProcess: (
        buffers: any,
        powerLevel: any,
        bufferDuration: number,
        bufferSampleRate: number
      ) => {
        if (startTimeRef.current !== null) {
          const currentTime = Date.now() - startTimeRef.current;

          setRecordingDuration(currentTime + durationRef.current);
        }
      },
      onError: (err: any) => {
        setError(err.message);
      },
    });
  };

  const start = async () => {
    if (status === 'Recording') return;

    if (!recorderRef.current) {
      recorderRef.current = createRecorder();
    }

    try {
      await new Promise<void>((resolve, reject) => {
        recorderRef.current?.open(
          () => {
            recorderRef.current?.start();
            resolve();
          },
          (msg: string) => {
            reject(new Error(msg));
          }
        );
      });
      startTimeRef.current = Date.now();
      durationRef.current = 0;
      setRecordingDuration(0);
      setStatus('Recording');
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      console.error(err);
      setStatus('Idle');
    }
  };

  const stop = async () => {
    if (status !== 'Recording' && status !== 'Paused') return;

    new Promise<void>((resolve, reject) => {
      recorderRef.current?.stop(
        (blob: Blob) => {
          setRecordedBlob(blob);
          setStatus('Stopped');
          startTimeRef.current = null;
          setRecordingDuration(0);
          resolve();
        },
        (msg: string) => {
          setError(msg);
          reject(new Error(msg));
        }
      );
    });
  };

  const stopWithData = async () => {
    if (status !== 'Recording' && status !== 'Paused') return null;

    return new Promise<Blob | null>((resolve, reject) => {
      recorderRef.current?.stop(
        (blob: Blob) => {
          setRecordedBlob(blob);
          setStatus('Stopped');
          startTimeRef.current = null;
          setRecordingDuration(0);
          resolve(blob);
        },
        (msg: string) => {
          setError(msg);
          reject(new Error(msg));
        }
      );
    });
  };

  const pause = () => {
    if (status !== 'Recording') return;

    recorderRef.current?.pause();
    durationRef.current = recordingDuration;
    setStatus('Paused');
    startTimeRef.current = null;
  };

  const resume = () => {
    if (status !== 'Paused') return;

    recorderRef.current?.resume();
    setStatus('Recording');
    startTimeRef.current = Date.now();
  };

  const close = () => {
    if (recorderRef.current) {
      recorderRef.current.close();
      recorderRef.current = null;
    }
    setStatus('Idle');
    startTimeRef.current = null;
    durationRef.current = 0;
    setRecordingDuration(0);
  };

  useEffect(() => {
    return () => {
      close();
    };
  }, []);

  return {
    status,
    sampleRate,
    setSampleRate,
    start,
    stop,
    stopWithData,
    pause,
    resume,
    close,
    isRecording,
    recordedBlob,
    recordingDuration,
    error,
  };
};

export default useAudioRecorder;
