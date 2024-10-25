export async function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const audioContext = new AudioContext();
    const reader = new FileReader();

    reader.onload = function (event) {
      if (event.target?.result instanceof ArrayBuffer) {
        audioContext.decodeAudioData(
          event.target.result,
          (buffer) => {
            const duration = buffer.duration;

            resolve(duration);
          },
          (error) => {
            reject(error);
          }
        );
      }
    };

    reader.onerror = function () {
      reject(new Error('Failed to read the audio blob'));
    };

    reader.readAsArrayBuffer(blob);
  });
}
