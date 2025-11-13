import { useState, useCallback, useEffect } from 'react';

export function usePictureInPicture(videoRef: React.RefObject<HTMLVideoElement>) {
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [isPiPSupported, setIsPiPSupported] = useState(false);

  useEffect(() => {
    // Check if Picture-in-Picture is supported
    setIsPiPSupported(
      document.pictureInPictureEnabled && 
      videoRef.current !== null &&
      !videoRef.current.disablePictureInPicture
    );

    const video = videoRef.current;
    if (!video) return;

    const handleEnterPiP = () => setIsPiPActive(true);
    const handleLeavePiP = () => setIsPiPActive(false);

    video.addEventListener('enterpictureinpicture', handleEnterPiP);
    video.addEventListener('leavepictureinpicture', handleLeavePiP);

    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPiP);
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, [videoRef]);

  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error('Failed to toggle Picture-in-Picture:', error);
    }
  }, [videoRef]);

  const enterPiP = useCallback(async () => {
    if (!videoRef.current || isPiPActive) return;

    try {
      await videoRef.current.requestPictureInPicture();
    } catch (error) {
      console.error('Failed to enter Picture-in-Picture:', error);
    }
  }, [videoRef, isPiPActive]);

  const exitPiP = useCallback(async () => {
    if (!isPiPActive) return;

    try {
      await document.exitPictureInPicture();
    } catch (error) {
      console.error('Failed to exit Picture-in-Picture:', error);
    }
  }, [isPiPActive]);

  return {
    isPiPActive,
    isPiPSupported,
    togglePiP,
    enterPiP,
    exitPiP,
  };
}
