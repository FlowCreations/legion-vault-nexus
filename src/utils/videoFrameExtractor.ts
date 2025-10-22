export interface VideoFrame {
  timestamp: number;
  dataUrl: string;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps?: number;
}

export const extractVideoFrames = async (
  videoFile: File,
  intervalSeconds: number = 5
): Promise<{ frames: VideoFrame[]; metadata: VideoMetadata }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    video.preload = 'metadata';
    video.src = URL.createObjectURL(videoFile);

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;

      // Set canvas size (max 720p for optimization)
      const scale = Math.min(1, 720 / height);
      canvas.width = width * scale;
      canvas.height = height * scale;

      const frames: VideoFrame[] = [];
      const timestamps: number[] = [];

      // Generate timestamps for frame extraction
      for (let time = 0; time < duration; time += intervalSeconds) {
        timestamps.push(time);
      }
      // Always include the last frame
      if (timestamps[timestamps.length - 1] !== duration) {
        timestamps.push(duration - 0.1);
      }

      let currentIndex = 0;

      const extractFrame = () => {
        if (currentIndex >= timestamps.length) {
          URL.revokeObjectURL(video.src);
          resolve({
            frames,
            metadata: {
              duration,
              width,
              height,
            },
          });
          return;
        }

        video.currentTime = timestamps[currentIndex];
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

        frames.push({
          timestamp: timestamps[currentIndex],
          dataUrl,
        });

        currentIndex++;
        extractFrame();
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Error loading video'));
      };

      extractFrame();
    };

    video.onerror = () => {
      reject(new Error('Error loading video metadata'));
    };
  });
};
