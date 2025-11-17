interface BehaviorWeight {
  behavior_key: string;
  behavior_name: string;
  weight: number;
  zone: string;
  tier: string;
  description: string;
}

interface BehaviorLog {
  behavior_key: string;
  behavior_name: string;
  weight: number;
  tier: string;
  triggered: boolean;
  count?: number;
}

export async function computePTP(
  supabaseClient: any,
  memberId: string,
  events: any[],
  profile: any
): Promise<{ score: number; zone: string; status: string; behaviors: BehaviorLog[] }> {
  
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  let totalScore = 0;
  const behaviorLog: BehaviorLog[] = [];
  
  // Fetch all behavior weights
  const { data: weights } = await supabaseClient
    .from('ptp_behavior_weights')
    .select('*');
  
  if (!weights || weights.length === 0) {
    console.error('No behavior weights found');
    return { score: 0, zone: 'red', status: 'Stop', behaviors: [] };
  }
  
  const weightMap = new Map<string, BehaviorWeight>(
    weights.map((w: BehaviorWeight) => [w.behavior_key, w])
  );
  
  const recentEvents = events.filter(e => new Date(e.created_at) >= last30Days);
  
  // Helper to add behavior
  const addBehavior = (key: string, count = 1) => {
    const behavior = weightMap.get(key);
    if (behavior) {
      totalScore += behavior.weight;
      behaviorLog.push({
        ...behavior,
        triggered: true,
        count
      });
    }
  };
  
  // 1. LOGIN FREQUENCY
  const loginCount = recentEvents.filter(e => e.event_type === 'login').length;
  
  if (loginCount < 3) {
    addBehavior('login_infrequent');
  } else if (loginCount >= 8) { // 2+ per week
    addBehavior('login_frequent');
  } else if (loginCount >= 4) { // weekly
    addBehavior('login_weekly');
  }
  
  // 2. TIME SPENT (from profile watch_time + listen_time in seconds)
  const totalTimeSeconds = (profile?.watch_time || 0) + (profile?.listen_time || 0);
  const weeklyTimeMinutes = totalTimeSeconds / 60 / 4.3; // Average weeks in month
  
  if (weeklyTimeMinutes < 10) {
    addBehavior('low_time_spent');
  } else if (weeklyTimeMinutes > 60) {
    addBehavior('high_time_spent');
  } else if (weeklyTimeMinutes >= 10 && weeklyTimeMinutes <= 40) {
    addBehavior('moderate_time_spent');
  }
  
  // 3. MUSIC ENGAGEMENT
  const musicListenEvents = recentEvents.filter(e => e.event_type === 'music_listen');
  const fullSongs = musicListenEvents.filter(e => 
    e.event_data?.duration >= 180 // 3+ minutes = full song
  ).length;
  
  if (fullSongs < 2) {
    addBehavior('few_songs_played');
  } else if (fullSongs >= 10) {
    addBehavior('album_streams');
  } else if (musicListenEvents.length >= 5) {
    addBehavior('multiple_songs_partial');
  }
  
  // 4. VIDEO ENGAGEMENT
  const videoEvents = recentEvents.filter(e => e.event_type === 'video_watch');
  const fullVideos = videoEvents.filter(e => 
    e.event_data?.duration >= 300 // 5+ minutes
  ).length;
  
  if (fullVideos >= 5) {
    addBehavior('video_complete_many');
  } else if (fullVideos >= 3) {
    addBehavior('video_complete_multiple');
  } else if (videoEvents.length >= 1 && videoEvents.length <= 2) {
    addBehavior('video_partial_view');
  }
  
  // Check for rewatching
  const rewatchedContent = new Set();
  videoEvents.forEach(e => {
    const contentId = e.event_data?.videoId || e.event_data?.id;
    if (contentId && rewatchedContent.has(contentId)) {
      addBehavior('content_rewatch');
    }
    if (contentId) rewatchedContent.add(contentId);
  });
  
  // 5. FAVORITES
  const favoritesCount = recentEvents.filter(e => e.event_type === 'favorites_add').length;
  if (favoritesCount === 0) {
    addBehavior('no_favorites');
  } else if (favoritesCount > 0) {
    addBehavior('favorites_created');
  }
  
  // 6. CART BEHAVIOR
  const cartAdds = recentEvents.filter(e => e.event_type === 'add_to_cart').length;
  const checkouts = recentEvents.filter(e => e.event_type === 'purchase_started').length;
  const purchases = recentEvents.filter(e => e.event_type === 'purchase_completed').length;
  
  if (cartAdds >= 2) {
    addBehavior('cart_multiple_adds');
  } else if (cartAdds > 0 && checkouts === 0) {
    addBehavior('cart_add_no_checkout');
  }
  
  // 7. CHECKOUT BEHAVIOR
  const checkoutViews = recentEvents.filter(e => e.event_type === 'checkout_view').length;
  
  if (checkoutViews > 0 && purchases === 0) {
    addBehavior('checkout_page_view');
  }
  
  if (cartAdds > 0 && checkoutViews > 0 && purchases === 0) {
    addBehavior('cart_payment_abandon');
  }
  
  // 8. MERCH ENGAGEMENT
  const merchViews = recentEvents.filter(e => e.event_type === 'merch_view').length;
  const merchDetailViews = recentEvents.filter(e => e.event_type === 'merch_detail_view').length;
  const productHovers = recentEvents.filter(e => e.event_type === 'product_hover').length;
  
  if (merchViews > 0 && cartAdds === 0 && productHovers === 0) {
    addBehavior('merch_view_no_click');
  } else if (merchDetailViews > 0) {
    addBehavior('merch_read_details');
  }
  
  if (merchViews >= 2 || productHovers >= 2) {
    addBehavior('merch_revisit');
  }
  
  // 9. COMMUNITY ENGAGEMENT
  const comments = recentEvents.filter(e => e.event_type === 'comment_post').length;
  const likes = recentEvents.filter(e => e.event_type === 'like' || e.event_type === 'reaction').length;
  const communityViews = recentEvents.filter(e => e.page_url?.includes('/community')).length;
  
  if (comments === 0 && likes === 0) {
    addBehavior('no_engagement');
  } else if (comments >= 3) {
    addBehavior('active_comments');
  } else if (comments >= 1) {
    addBehavior('comment_occasional');
  }
  
  if (likes > 0) {
    addBehavior('community_likes');
  }
  
  if (likes > 3 || comments > 3) {
    addBehavior('reaction_engagement');
  }
  
  if (communityViews > 0 && comments === 0 && likes === 0) {
    addBehavior('community_view_no_post');
  }
  
  // 10. EMAIL ENGAGEMENT
  const emailOpens = recentEvents.filter(e => e.event_type === 'email_open').length;
  const emailClicks = recentEvents.filter(e => e.event_type === 'email_click').length;
  const emailsSent = 10; // Assume 10 emails sent in 30 days
  const openRate = emailsSent > 0 ? emailOpens / emailsSent : 0;
  
  if (openRate > 0.8) {
    addBehavior('email_high_open');
  } else if (openRate >= 0.5) {
    addBehavior('email_half_open');
  } else if (emailOpens > 0 && emailClicks === 0) {
    addBehavior('email_open_no_click');
  }
  
  if (emailClicks > 0) {
    addBehavior('email_link_click');
  }
  
  // 11. SHOWS / EVENTS
  const showViews = recentEvents.filter(e => e.event_type === 'show_view').length;
  const ticketClicks = recentEvents.filter(e => e.event_type === 'ticket_click').length;
  const rsvps = recentEvents.filter(e => e.event_type === 'rsvp_livestream').length;
  const attended = recentEvents.filter(e => e.event_type === 'attend_livestream').length;
  
  if (showViews > 0 && ticketClicks === 0) {
    addBehavior('show_view_no_ticket');
  } else if (ticketClicks > 0) {
    addBehavior('show_ticket_click');
  }
  
  if (rsvps > 0 && attended > 0) {
    addBehavior('livestream_rsvp_attend');
  } else if (rsvps > 0 && attended === 0) {
    addBehavior('rsvp_no_attend');
  } else if (rsvps === 0) {
    addBehavior('no_rsvp');
  }
  
  // Check for full livestream watch
  const livestreamWatchEvents = recentEvents.filter(e => 
    e.event_type === 'video_watch' && e.event_data?.isLivestream
  );
  const fullLivestreamWatch = livestreamWatchEvents.some(e => 
    e.event_data?.duration >= 1800 // 30+ minutes
  );
  if (fullLivestreamWatch) {
    addBehavior('full_livestream_watch');
  }
  
  // 12. SHARES
  const shares = recentEvents.filter(e => e.event_type === 'share').length;
  if (shares >= 2) {
    addBehavior('share_multiple');
  } else if (shares === 1) {
    addBehavior('share_once');
  }
  
  // 13. DOWNLOADS
  const downloads = recentEvents.filter(e => e.event_type === 'download_track').length;
  if (downloads > 0) {
    addBehavior('free_download');
  }
  
  // 14. POLLS
  const pollParticipation = recentEvents.filter(e => e.event_type === 'poll_participate').length;
  if (pollParticipation > 0) {
    addBehavior('poll_participation');
  }
  
  // 15. MULTI-SECTION VISITS
  const sessionEvents = recentEvents.filter(e => e.event_type === 'session_start');
  const multiSectionSessions = sessionEvents.filter(session => {
    const sessionId = session.session_id;
    const sessionPages = recentEvents.filter(e => e.session_id === sessionId);
    const uniqueSections = new Set(sessionPages.map(e => {
      const path = e.page_url?.split('/')[1];
      return path;
    }));
    return uniqueSections.size >= 3;
  }).length;
  
  if (multiSectionSessions > 0) {
    addBehavior('multi_section_visit');
  }
  
  // 16. BIO/ABOUT VIEWS
  const bioViews = recentEvents.filter(e => e.event_type === 'bio_view' || e.page_url?.includes('/about')).length;
  if (bioViews > 0 && recentEvents.length === bioViews) {
    addBehavior('bio_only_view');
  }
  
  // 17. BOUNCE DETECTION
  const sessionEndEvents = recentEvents.filter(e => e.event_type === 'session_end');
  const bounces = sessionEndEvents.filter(e => 
    e.event_data?.duration < 30
  ).length;
  if (bounces > 0) {
    addBehavior('quick_bounce');
  }
  
  // 18. COUNTDOWN WATCHES
  const countdownViews = recentEvents.filter(e => e.event_type === 'watch_countdown').length;
  if (countdownViews > 0) {
    addBehavior('countdown_watch');
  }
  
  // 19. DEVICE USAGE
  const mobileVisits = recentEvents.filter(e => e.event_type === 'mobile_visit').length;
  const desktopVisits = recentEvents.filter(e => e.event_type === 'desktop_visit').length;
  if (mobileVisits > 0 && desktopVisits > 0) {
    addBehavior('multi_platform_use');
  }
  
  // 20. PURCHASES
  if (purchases > 0 || (profile?.total_spend || 0) > 0) {
    addBehavior('purchase_digital');
  }
  
  // 21. DIRECT TRAFFIC
  const directTraffic = recentEvents.filter(e => 
    !e.event_data?.referrer || e.event_data?.referrer === ''
  ).length;
  const totalTraffic = recentEvents.length;
  if (directTraffic > totalTraffic * 0.8 && totalTraffic > 5) {
    addBehavior('direct_return');
  }
  
  // 22. AD-ONLY TRAFFIC
  const adTraffic = recentEvents.filter(e => 
    e.event_data?.referrer?.includes('facebook.com') || 
    e.event_data?.referrer?.includes('instagram.com') ||
    e.event_data?.utm_source
  ).length;
  if (adTraffic === totalTraffic && totalTraffic > 0) {
    addBehavior('ad_only_visit');
  }
  
  // 23. PROFILE COMPLETION
  const profileCompleteEvents = recentEvents.filter(e => e.event_type === 'profile_complete').length;
  if (profileCompleteEvents === 0 && !profile?.email_verified) {
    addBehavior('no_profile_complete');
  }
  
  // 24. PROMO ENGAGEMENT
  const promoEvents = recentEvents.filter(e => 
    e.event_data?.isPromo && e.event_data?.duration >= 300
  );
  if (promoEvents.length > 0) {
    addBehavior('promo_linger');
  }
  
  // DECAY ADJUSTMENTS
  const inactiveDays = profile?.inactive_days || 0;
  if (inactiveDays >= 30) {
    totalScore -= 25;
    behaviorLog.push({
      behavior_key: 'decay_30d',
      behavior_name: '30+ day inactivity penalty',
      weight: -25,
      tier: 'passive',
      triggered: true
    });
  } else if (inactiveDays >= 14) {
    totalScore -= 10;
    behaviorLog.push({
      behavior_key: 'decay_14d',
      behavior_name: '14+ day inactivity penalty',
      weight: -10,
      tier: 'passive',
      triggered: true
    });
  }
  
  // RECENCY BONUSES
  const loginStreak = profile?.login_streak || 0;
  if (loginStreak >= 5) {
    totalScore += 10;
    behaviorLog.push({
      behavior_key: 'login_streak_bonus',
      behavior_name: '5+ login streak bonus',
      weight: 10,
      tier: 'interactive',
      triggered: true
    });
  }
  
  // Recent purchase reset
  if (purchases > 0) {
    const lastPurchase = recentEvents
      .filter(e => e.event_type === 'purchase_completed')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    
    if (lastPurchase && new Date(lastPurchase.created_at) >= last7Days) {
      totalScore = Math.max(totalScore, 90);
      behaviorLog.push({
        behavior_key: 'recent_purchase_boost',
        behavior_name: 'Recent purchase boost',
        weight: 90,
        tier: 'emotional_committed',
        triggered: true
      });
    }
  }

  // ============= ECONOMIC INTELLIGENCE LAYER =============
  const areaCode = profile?.area_code;
  const estimatedIncome = profile?.estimated_household_income;
  const purchasingPower = profile?.purchasing_power_score;
  const location = profile?.location;

  if (areaCode && estimatedIncome && profile?.allow_economic_profiling !== false) {
    // Income-based scoring
    if (estimatedIncome >= 100000) {
      addBehavior('high_income_area');
    } else if (estimatedIncome >= 50000) {
      addBehavior('moderate_income_area');
    } else {
      addBehavior('low_income_area');
    }
    
    // Purchasing power adjustment
    if (purchasingPower) {
      if (purchasingPower >= 75) {
        addBehavior('high_purchasing_power');
      } else if (purchasingPower >= 40) {
        addBehavior('moderate_purchasing_power');
      }
    }
    
    // Urban/Rural classification impact
    const majorMetroAreas = ['New York', 'Los Angeles', 'San Francisco', 'Chicago', 'Boston', 'Seattle', 'Washington'];
    if (location && majorMetroAreas.some(city => location.includes(city))) {
      addBehavior('urban_premium');
    }
    
    // Cost-of-living normalization flag
    if (purchasingPower) {
      addBehavior('cost_of_living_adjusted');
    }
  }

  // ============= PAYDAY PATTERN INTELLIGENCE =============
  const paydayPattern = profile?.payday_pattern as any;
  const likelyPaydays = (profile?.likely_payday_dates || []) as number[];
  const paydayConfidence = profile?.payday_confidence_score || 0;
  const payrollCycle = profile?.payroll_cycle_type;

  if (paydayPattern?.detected && paydayConfidence >= 40 && profile?.allow_economic_profiling !== false) {
    // Behavior: Payday pattern identified
    addBehavior('payday_detected');

    // Check if user is near payday window
    const today = new Date();
    const currentDay = today.getDate();
    
    const isNearPayday = likelyPaydays.some(payday => {
      const diff = currentDay - payday;
      return diff >= 0 && diff <= 3; // 0-3 days after payday
    });

    const isPrePayday = likelyPaydays.some(payday => {
      const diff = payday - currentDay;
      return diff >= 1 && diff <= 5; // 1-5 days before payday
    });

    if (isNearPayday) {
      addBehavior('near_payday'); // +15 points
      addBehavior('post_payday_purchaser'); // +12 points
    } else if (isPrePayday) {
      addBehavior('pre_payday_contacted'); // -5 points
    }

    // Biweekly bonus
    if (payrollCycle === 'biweekly') {
      addBehavior('biweekly_payday'); // +10 points
    }

    // Proximity boost - additional points based on days since payday
    if (isNearPayday) {
      const daysSincePayday = likelyPaydays
        .map(payday => currentDay - payday)
        .filter(diff => diff >= 0 && diff <= 3)
        .sort((a, b) => a - b)[0];
      
      if (daysSincePayday !== undefined) {
        const proximityBoost = Math.floor((3 - daysSincePayday) * 3);
        totalScore += proximityBoost;
      }
    }
  }
  
  // Clamp to 0-100
  totalScore = Math.max(0, Math.min(100, totalScore));
  
  // Determine zone and status
  let zone = 'red';
  let status = 'Stop';
  
  if (totalScore >= 67) {
    zone = 'green';
    status = 'Go';
  } else if (totalScore >= 34) {
    zone = 'yellow';
    status = 'Wait';
  }
  
  return { score: totalScore, zone, status, behaviors: behaviorLog };
}
