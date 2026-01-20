import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Community content - Announcements from official Sons of Legion account
const announcementContent = [
  {
    content: "Big news LEGION — we're playing our first-ever festival. Tortuga Music Festival in Fort Lauderdale, April 4-6. Presale starts Friday. Let's make some noise 🏴‍☠️🔥",
    tagged_all: true,
    link_url: "https://tortugamusicfestival.com/passes/"
  },
  {
    content: "It's been a rough day for Daddy Jack. The AC went out in the tour bus, his voice is shot from last night's show, and someone ate his sandwich. But he's still smiling because YOU showed up. 47,000 of you watched last night. That's insane. We love you, Legion. 🖤",
    tagged_all: false
  },
  {
    content: "NEW MERCH DROP 🔥 The 'Midnight Rider' collection just went live. Limited run of 500. These won't last. Link in bio or hit the store now.",
    tagged_all: true,
    link_url: "/store"
  },
  {
    content: "Tour dates dropping next week. 32 cities. Some places we've never played before. Some places we're finally coming back to. Get ready. 🗺️",
    tagged_all: true
  },
  {
    content: "To every single one of you who streamed 'Last Stand' over 10 million times this month — we see you. We feel you. You made that song what it is. From the bottom of our hearts, thank you. 💀🖤",
    tagged_all: false
  },
  {
    content: "LIVE STREAM TONIGHT @ 8PM ET — Jack's doing an acoustic set from the studio. Just him, a guitar, and whatever songs you request in chat. Don't miss it.",
    tagged_all: true
  }
];

// Legion Speaks - Different staff/admin personas with unique voices
const legionSpeaksContent = [
  {
    author: 'Denice Dal Braccio',
    content: "Hey @Everyone! Now that we've had this community running for a few months, I wanted to check in. What do you love? What do you wish we had? Drop your feedback below — we actually read everything. This is YOUR space. Let's make it better together. 💬"
  },
  {
    author: 'Jake Morrison',
    content: "Tour life update: We're in Kansas City right now. The crew just finished soundcheck and the room sounds INCREDIBLE. If you're coming tonight, get there early — we've got a surprise opener that's going to blow your minds. See you in the pit 🤘"
  },
  {
    author: 'Maria Santos',
    content: "Quick reminder about our upcoming virtual meet & greet on the 15th! Legionnaires — you should have received your exclusive Zoom links. If you haven't, DM me. Outlaws and Rebels — we're doing a separate session for you on the 18th. Can't wait to see your faces! 📹"
  },
  {
    author: 'Tommy Chen',
    content: "Behind the scenes moment: We just wrapped a 14-hour studio session for the new album. Jack rewrote the bridge on track 7 at least 15 times. The man doesn't stop until it's perfect. Your patience will be rewarded. This album is going to hit different. 🎸"
  },
  {
    author: 'Rachel Webb',
    content: "ATTENTION LEGION ARTISTS! 🎨 We're looking for fan art for the next tour's visuals. Best submissions might end up on actual merch or stage screens. Drop your work in the Art & Creatives channel. Winners get VIP passes + signed gear. Let's see what you've got!"
  },
  {
    author: 'Mike Torres',
    content: "Crew chief here. Had to share this — during load-in today, a local crew guy told us he drove 6 hours to work this show because he's been a fan since the first album. That's the Legion spirit. We're not just building stages, we're building family. 🖤"
  },
  {
    author: 'Denice Dal Braccio',
    content: "New exclusive content just dropped in the Vault! Full documentary from the Nashville recording sessions — 47 minutes of raw, uncut footage. This is stuff that's never been released anywhere. Legionnaires and Outlaws, go check it out. You earned it. 🎬"
  },
  {
    author: 'Jake Morrison',
    content: "Real talk: Last night's show in Denver was one of the best we've ever played. The altitude, the energy, something about that crowd... When you all sang every word to 'Rebel Heart' back at us, Jack literally teared up. We'll never forget that. Thank you, Denver Legion. 🏔️"
  }
];

// Member intro templates
const introTemplates = [
  { name: 'Sarah Mitchell', city: 'Nashville, TN', content: "Hey Legion! Been a fan since the Dive Bar Days tour in 2019. Finally joined the community after that insane show in Memphis last month. So stoked to be here! 🎸" },
  { name: 'Marcus Johnson', city: 'Austin, TX', content: "What's up everyone! Austin represent! Discovered SOL through a random Spotify playlist and haven't stopped listening since. 'Thunder Road' literally changed my life. Ready to connect with y'all! 🤘" },
  { name: 'Emma Chen', city: 'Seattle, WA', content: "Hi family! Emma here from rainy Seattle. My boyfriend introduced me to the band last year and now I'm the bigger fan 😂 Can't wait for the PNW tour dates!" },
  { name: 'Jake Rodriguez', city: 'Miami, FL', content: "MIAMI IN THE HOUSE! 🌴 Been to 7 shows and counting. Got the Legion skull tattooed on my arm last year. No regrets. Let's goooo!" },
  { name: 'Ashley Williams', city: 'Denver, CO', content: "Hey y'all! Single mom of two here. The boys' music gets me through the hard days. Finally treating myself to this membership. So happy to be part of something bigger. 💜" },
  { name: 'Brandon Lee', city: 'Chicago, IL', content: "Chicago native checking in! Work in music production and have to say — the production quality on the new album is INSANE. Would love to connect with other audio nerds here!" },
  { name: 'Jessica Brown', city: 'Portland, OR', content: "Introvert finally coming out of my shell to say hi! Been lurking for months. The community vibes here are so positive compared to other fan groups. You all are amazing. 🖤" },
  { name: 'Tyler Martinez', city: 'Phoenix, AZ', content: "What up Legion! Desert dweller here 🌵 Caught my first show in Vegas and I'm HOOKED. Who else is hitting the Southwest dates??" },
  { name: 'Samantha Davis', city: 'Atlanta, GA', content: "ATL Legion where you at?! 🍑 So excited to finally join. Been saving up for the Legionnaire tier because these boys DESERVE IT. Best community ever!" },
  { name: 'Chris Thompson', city: 'Boston, MA', content: "Boston strong! 💪 Found SOL during the pandemic and their music literally saved me. Not exaggerating. Proud to support artists who keep it real. Let's ride!" },
  { name: 'Nicole Anderson', city: 'San Diego, CA', content: "SoCal girl here! Just got back from the LA show — my voice is GONE and my ears are still ringing. Worth every second. Who else was there?! 🔥" },
  { name: 'David Kim', city: 'New York, NY', content: "NYC checking in! Work on Wall Street but blast 'Born to Ride' every morning to remind myself there's more to life than spreadsheets 😂 Glad to be here fam!" },
  { name: 'Rachel Green', city: 'Nashville, TN', content: "Another Nashville native! Actually ran into Jack at a coffee shop once and he was SO down to earth. Chatted for like 10 minutes. These guys are the real deal. 🎶" },
  { name: 'Andrew Wilson', city: 'Dallas, TX', content: "TEXAS FOREVER 🤠 Been to every Texas show for 3 years straight. My wife thinks I'm crazy. She's probably right. No regrets though!" },
  { name: 'Laura Martinez', city: 'Minneapolis, MN', content: "Minnesota represent! 🥶 It's freezing here but the Legion keeps me warm. Just convinced my whole friend group to sign up. We're taking over! ❄️" }
];

// Comment templates
const commentTemplates = [
  "This is exactly what I needed to hear today 🙌",
  "LEGION STRONG 🖤",
  "So hyped for this!!",
  "Been waiting for this update! Thank you! 🔥",
  "This community is everything 💀",
  "Can't wait! Already got my tickets!",
  "Y'all are the best. Seriously.",
  "FINALLY! Been refreshing all day for this 😂",
  "The boys never disappoint",
  "Crying in the club rn 😭❤️",
  "SEE YOU THERE!!! 🤘",
  "This made my whole week",
  "Shared this with everyone I know",
  "Absolute legends. All of them.",
  "Best decision I ever made joining this community"
];

const reactionTypes = ['like', 'heart', 'fire', 'skull', 'celebrate'];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): Date {
  const now = new Date();
  const randomDays = Math.floor(Math.random() * daysAgo);
  return new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting community content seeding...');

    // Get user profiles (limit for performance)
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('user_profiles')
      .select('id, user_id, display_name, tier')
      .limit(100);

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No profiles found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing with ${profiles.length} profiles...`);

    let totalPosts = 0;
    let totalReactions = 0;
    let totalComments = 0;

    // Delete existing demo community posts first (clean slate)
    const { error: deleteError } = await supabaseClient
      .from('community_posts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all posts

    if (deleteError) {
      console.log('Note: Could not delete existing posts:', deleteError.message);
    }

    // Also clear reactions and comments
    await supabaseClient.from('post_reactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('post_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Get official user ID for announcements
    const officialUserId = profiles.find(p => p.tier === 'Legionnaires')?.user_id || profiles[0]?.user_id;

    // Create announcements
    const announcementPosts = announcementContent.map((announcement, i) => {
      const daysAgo = i * 5 + randomBetween(1, 4);
      const createdAt = randomDate(daysAgo);
      return {
        user_id: officialUserId,
        content: announcement.content,
        category: 'announcements',
        post_type: announcement.link_url ? 'link' : 'text',
        tagged_all: announcement.tagged_all,
        link_url: announcement.link_url || null,
        view_count: randomBetween(200, 800),
        created_at: createdAt.toISOString(),
        updated_at: createdAt.toISOString()
      };
    });

    const { data: insertedAnnouncements, error: announcementError } = await supabaseClient
      .from('community_posts')
      .insert(announcementPosts)
      .select('id');

    if (announcementError) {
      console.error('Error inserting announcements:', announcementError);
    } else {
      totalPosts += announcementPosts.length;
      console.log(`Inserted ${announcementPosts.length} announcements`);
    }

    // Create Legion Speaks posts
    const shuffledProfiles = shuffleArray(profiles.filter(p => p.tier === 'Legionnaires' || p.tier === 'Outlaws'));
    const legionSpeaksPosts = legionSpeaksContent.map((post, i) => {
      const authorProfile = shuffledProfiles[i % shuffledProfiles.length] || profiles[i % profiles.length];
      const daysAgo = i * 3 + randomBetween(1, 3);
      const createdAt = randomDate(daysAgo);
      return {
        user_id: authorProfile?.user_id || officialUserId,
        content: post.content,
        category: 'legion_speaks',
        post_type: 'text',
        tagged_all: post.content.includes('@Everyone'),
        view_count: randomBetween(100, 400),
        created_at: createdAt.toISOString(),
        updated_at: createdAt.toISOString()
      };
    });

    const { data: insertedLegionSpeaks, error: legionSpeaksError } = await supabaseClient
      .from('community_posts')
      .insert(legionSpeaksPosts)
      .select('id');

    if (legionSpeaksError) {
      console.error('Error inserting legion speaks:', legionSpeaksError);
    } else {
      totalPosts += legionSpeaksPosts.length;
      console.log(`Inserted ${legionSpeaksPosts.length} Legion Speaks posts`);
    }

    // Create member intro posts
    const introProfiles = shuffleArray([...profiles]).slice(0, Math.min(introTemplates.length, profiles.length));
    const introPosts = introProfiles.map((profile, i) => {
      const template = introTemplates[i];
      const daysAgo = randomBetween(5, 45);
      const createdAt = randomDate(daysAgo);
      return {
        user_id: profile.user_id,
        content: template.content,
        category: 'intros',
        post_type: 'text',
        tagged_all: false,
        view_count: randomBetween(30, 150),
        created_at: createdAt.toISOString(),
        updated_at: createdAt.toISOString()
      };
    });

    const { data: insertedIntros, error: introsError } = await supabaseClient
      .from('community_posts')
      .insert(introPosts)
      .select('id');

    if (introsError) {
      console.error('Error inserting intros:', introsError);
    } else {
      totalPosts += introPosts.length;
      console.log(`Inserted ${introPosts.length} intro posts`);
    }

    // Gather all post IDs for reactions and comments
    const allInsertedPosts = [
      ...(insertedAnnouncements || []),
      ...(insertedLegionSpeaks || []),
      ...(insertedIntros || [])
    ];

    // Add reactions
    if (allInsertedPosts.length > 0) {
      const reactions: any[] = [];
      
      for (const post of allInsertedPosts) {
        const numReactions = randomBetween(5, 25);
        const reactingProfiles = shuffleArray([...profiles]).slice(0, numReactions);
        
        for (const profile of reactingProfiles) {
          reactions.push({
            post_id: post.id,
            user_id: profile.user_id,
            reaction_type: pickRandom(reactionTypes),
            created_at: randomDate(30).toISOString()
          });
        }
      }

      const { error: reactionError } = await supabaseClient
        .from('post_reactions')
        .insert(reactions);
      
      if (!reactionError) {
        totalReactions = reactions.length;
        console.log(`Inserted ${totalReactions} reactions`);
      } else {
        console.error('Error inserting reactions:', reactionError);
      }
    }

    // Add comments
    if (allInsertedPosts.length > 0) {
      const comments: any[] = [];
      
      for (const post of allInsertedPosts) {
        const numComments = randomBetween(1, 6);
        const commentingProfiles = shuffleArray([...profiles]).slice(0, numComments);
        
        for (const profile of commentingProfiles) {
          comments.push({
            post_id: post.id,
            user_id: profile.user_id,
            content: pickRandom(commentTemplates),
            created_at: randomDate(25).toISOString()
          });
        }
      }

      const { error: commentError } = await supabaseClient
        .from('post_comments')
        .insert(comments);
      
      if (!commentError) {
        totalComments = comments.length;
        console.log(`Inserted ${totalComments} comments`);
      } else {
        console.error('Error inserting comments:', commentError);
      }
    }

    console.log('Community content seeding complete!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        communityPosts: totalPosts,
        reactions: totalReactions,
        comments: totalComments,
        message: 'Community demo data seeded successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
