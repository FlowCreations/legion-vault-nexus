import { useState, useEffect } from 'react';
import { useMusicPlayer } from '@/stores/musicPlayerStore';

const SURVEY_SHOWN_KEY = 'personality_survey_shown';
const SONG_LISTEN_COUNT_KEY = 'song_listen_count';

export const useSurveyTrigger = (pageType: 'merch' | 'other', options?: { testMode?: boolean }) => {
  const [showSurvey, setShowSurvey] = useState(false);
  const { playlist } = useMusicPlayer();

  useEffect(() => {
    // TEST MODE: Clear the survey shown flag and show immediately
    if (options?.testMode) {
      localStorage.removeItem(SURVEY_SHOWN_KEY);
      setShowSurvey(true);
      return;
    }

    // Check if survey was already shown
    const surveyShown = localStorage.getItem(SURVEY_SHOWN_KEY);
    if (surveyShown === 'true') return;

    // Get total songs listened from localStorage
    const songsListened = parseInt(localStorage.getItem(SONG_LISTEN_COUNT_KEY) || '0', 10);

    // Trigger after 3 songs have been played
    if (songsListened >= 3) {
      setShowSurvey(true);
    }
  }, [playlist]);

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
