import { CameoStatus } from "@/types/cameo";
import { format } from "date-fns";

export const generateVideoThumbnail = async (videoFile: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(2, video.duration / 2);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Could not generate thumbnail'));
        }
        URL.revokeObjectURL(video.src);
      }, 'image/jpeg', 0.8);
    };

    video.onerror = () => {
      reject(new Error('Error loading video'));
      URL.revokeObjectURL(video.src);
    };

    video.src = URL.createObjectURL(videoFile);
  });
};

export const formatCameoDate = (date: string): string => {
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
};

export const getCameoStatusColor = (status: CameoStatus): string => {
  const colors: Record<CameoStatus, string> = {
    active: 'bg-green-500',
    scheduled: 'bg-blue-500',
    expired: 'bg-gray-500',
    viewed: 'bg-purple-500',
  };
  return colors[status] || 'bg-gray-500';
};

export const getCameoStatusLabel = (status: CameoStatus): string => {
  const labels: Record<CameoStatus, string> = {
    active: 'Active',
    scheduled: 'Scheduled',
    expired: 'Expired',
    viewed: 'Viewed',
  };
  return labels[status] || status;
};

export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
