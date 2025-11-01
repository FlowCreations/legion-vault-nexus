import { useState, useEffect } from 'react';
import { useMusicPlayer } from '@/stores/musicPlayerStore';

const SURVEY_SHOWN_KEY = 'personality_survey_shown';
const SONG_LISTEN_COUNT_KEY = 'song_listen_count';

export const useSurveyTrigger = (pageType: 'merch' | 'other') => {
  const [showSurvey, setShowSurvey] = useState(false);
  const [timeOnPage, setTimeOnPage] = useState(0);
  const { playlist } = useMusicPlayer();

  useEffect(() => {
    // Check if survey was already shown
    const surveyShown = localStorage.getItem(SURVEY_SHOWN_KEY);
    if (surveyShown === 'true') return;

    let startTime = Date.now();
    let interval: NodeJS.Timeout;

    if (pageType === 'merch') {
      // Track time on merch page
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setTimeOnPage(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pageType]);

  useEffect(() => {
    const surveyShown = localStorage.getItem(SURVEY_SHOWN_KEY);
    if (surveyShown === 'true') return;

    // Get total songs listened from localStorage
    const songsListened = parseInt(localStorage.getItem(SONG_LISTEN_COUNT_KEY) || '0', 10);

    // Trigger conditions:
    // 1. Listened to 3+ songs
    // 2. Spent 10+ seconds on merch page
    if (songsListened >= 3 && timeOnPage >= 10 && pageType === 'merch') {
      setShowSurvey(true);
    }
  }, [timeOnPage, pageType, playlist]);

  const handleSurveyClose = () => {
    setShowSurvey(false);
    localStorage.setItem(SURVEY_SHOWN_KEY, 'true');
  };

  return { showSurvey, handleSurveyClose };
};

// Export helper to increment song listen count
export const incrementSongListenCount = () => {
  const current = parseInt(localStorage.getItem(SONG_LISTEN_COUNT_KEY) || '0', 10);
  localStorage.setItem(SONG_LISTEN_COUNT_KEY, String(current + 1));
};
