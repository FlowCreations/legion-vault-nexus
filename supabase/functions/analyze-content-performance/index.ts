import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoTitle, platform, frames, metadata } = await req.json();

    if (!frames || frames.length === 0) {
      throw new Error('No frames provided');
    }

    if (!platform) {
      throw new Error('Platform not specified');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Platform-specific best practices
    const platformGuidelines: Record<string, string> = {
      tiktok: `
**TikTok Best Practices:**
- First 3 seconds MUST hook or viewers scroll (extremely critical)
- Ideal length: 21-34 seconds for maximum engagement
- Vertical 9:16 format required
- Fast cuts every 1-3 seconds keep attention
- On-screen text/captions boost retention 40%
- Trending sounds increase discoverability 3x
- Face-to-camera shots perform 2x better
- Jump cuts and quick transitions essential
- Authentic, raw content outperforms polished
- Hook must be visual + auditory for sound-off viewing`,
      
      youtube: `
**YouTube Best Practices:**
- First 30 seconds determine 50% of retention
- Thumbnail + title must promise value delivered in video
- Ideal length varies: 8-15 min for tutorials, 4-6 min for entertainment
- Pattern interrupts every 20-30 seconds maintain attention
- Clear story arc: hook → value → payoff
- Face presence in first 3 seconds increases clicks 20%
- End screens and CTAs boost channel growth
- Pacing should match content type (faster for entertainment)
- YouTube algorithm favors watch time over views`,
      
      instagram: `
**Instagram Reels Best Practices:**
- First frame must be eye-catching (users decide in <1 second)
- 15-30 seconds optimal for completion rate
- Vertical 9:16 format essential
- Aesthetic quality matters more than on TikTok
- On-beat transitions boost engagement
- Trending audio increases reach 5x
- Text overlays critical (80% watch without sound)
- Hook in first 2 seconds or users swipe
- Visual variety every 3-5 seconds
- Strong call-to-action in caption`,
      
      "youtube-shorts": `
**YouTube Shorts Best Practices:**
- Similar to TikTok but slightly longer hooks work (3-5 sec)
- 30-60 seconds ideal length
- Loop-able content gets re-watched
- Clear, loud audio important
- Vertical format required
- Fast pacing but slightly less frantic than TikTok
- Timestamps and chapters don't work in Shorts
- Strong first frame (acts as thumbnail)`,
      
      facebook: `
**Facebook Best Practices:**
- Auto-play starts muted - visual hook essential
- Square (1:1) or vertical (4:5) outperforms horizontal
- Longer form content (2-5 min) performs well
- Emotional storytelling drives shares
- Captions required (85% watch without sound)
- Native uploads outperform YouTube links 10x
- Community engagement in comments boosts reach`,
      
      twitter: `
**Twitter/X Best Practices:**
- 20-45 seconds optimal (attention spans very short)
- Square format (1:1) best for feed
- First 2 seconds critical - users scroll fast
- Provocative/controversial hooks drive engagement
- Subtitles essential
- Memes and trends spread fastest
- Keep it punchy and quotable`
    };

    const platformGuide = platformGuidelines[platform] || platformGuidelines.tiktok;

    // Construct the analysis prompt
    const systemPrompt = `You are an expert social media content analyzer specializing in Sons of Legion's brand strategy and ${platform.toUpperCase()} optimization.

# BRAND IDENTITY CONTEXT

Sons of Legion is a rock band blending soul, blues, and power rock with a "luxury meets rebel" aesthetic inspired by John Varvatos and Sons of Anarchy. The band has achieved 8M+ streams and placements on ESPN and Netflix. 

**Core Brand Pillars:**
- Gritty authenticity meets refined style
- Military brotherhood and loyalty themes (Legion community)
- Outlaw rock with soul-blues foundation
- Strategic storytelling with emotional depth
- High-energy performances with raw emotion

# HOOK STRATEGY LIBRARY

Analyze if the video uses any of these 6 Sons of Legion hook types:

**1. FORTUNE TELLER**: "This band is the future of American rock"
   - Use for: Album previews, tour announcements, music innovation
   
**2. EXPERIMENTER**: "We played our heaviest set in a biker bar. Here's what happened."
   - Use for: Behind-the-scenes, unusual gigs, gear tests
   
**3. TEACHER**: "How we got 8M streams with no label"
   - Use for: Growth lessons, industry insights, building authority
   
**4. MAGICIAN**: "Watch this guitar solo melt the crowd"
   - Use for: Performance reels, stunning visuals, luxury-meets-rebel identity
   
**5. INVESTIGATOR**: "Why this band is everywhere but no one knows their name"
   - Use for: Marketing tactics, branding philosophy, industry secrets
   
**6. CONTRARIAN**: "Rock isn't dead—you're just listening to the wrong bands"
   - Use for: Polarizing topics, energy/intensity showcases

# 9 PSYCHOLOGY TACTICS FOR RETENTION

**1. COMPREHENSION MAXING** (Mr. Beast Method)
   - Every spoken word MUST be paired with matching visual
   - Example: Say "This is where Matrix was born" → Show actual studio, lyric notes, or emotional footage
   - No abstract shots; concrete visuals only
   - Comprehension loss = viewer bounce

**2. HAWK EYE NARRATIVES** (Broad to Narrow)
   - Start wide: "Rock music is shifting"
   - Then zoom: "Matrix is the answer"
   - Use establishing shots before close-ups
   - Give context before diving into details

**3. METAPHORS & VISUAL EXAMPLES**
   - Explain big ideas through real-world comparisons
   - Example: "Matrix = breaking chains of an invisible cage—loud, emotional, freeing"
   - Give viewers second chance to understand via different lens

**4. COMMON GROUND**
   - Make fans feel seen and understood
   - Example: "We all feel stuck sometimes—this track's for people trying to break free"
   - Build relatability through shared experiences

**5. SIMPLER WORDS, SIMPLER IDEAS**
   - Use tight, direct phrasing
   - Transform: "explores duality of internal struggle" 
   - Into: "the fight between who you are and who they say you should be"
   - Test: Would a smart 8-year-old understand?

**6. VISUAL STUN GUN**
   - Change visuals every 1-2 seconds in Reels/Shorts
   - Use flash transitions, glitch effects, strobe live clips
   - Match visual pacing to band's high energy
   - Don't overwhelm; stun just enough to hold attention

**7. VALUE COMPRESSION**
   - Give the best part FIRST, not at the end
   - Don't wait to deliver value
   - Start with the best riff/moment in first 5 seconds
   - Cut all fluff; no windup needed

**8. COME WITH PROOF**
   - Start with wins immediately
   - Example: "Over 8M streams, featured on ESPN and Netflix—this is Sons of Legion"
   - Build credibility in opening seconds
   - Show receipts, not just claims

**9. CONTRAST**
   - Show before vs after, expectation vs reality
   - Example: "You think you know rock? You haven't heard this."
   - Create tension through opposition
   - Highlight what makes SOL different

# STORYTELLING STRUCTURES

**3-Step Hook Format** (apply to every video):
1. **Context Lean-In**: Ultra-clear topic + signal relevance
   - "The real reason bands lose momentum after going viral..."
2. **Scroll-Stop Interjection**: Hard contrast line (use "but", "however", "yet")
   - "...but it has nothing to do with their sound."
3. **Contrarian Snapback**: Flip expectations, open curiosity
   - "It's because they ignored THIS fan behavior..."

**Conflict Loops** (The "Dance" Structure):
- Pattern: Context → BUT → Therefore
- Example: "We released a new track... but it bombed... so we rewrote the chorus overnight..."
- Use 3-4 loops per video to maintain engagement
- Each loop opens new question while closing previous one

# VISUAL + AUDIO DNA

Required SOL brand elements to check for:
- **Text Style**: Rugged serif + military stencil (John Varvatos/Sons of Anarchy aesthetic)
- **Colors**: Black, deep red, brass/gold accents (luxury meets grit)
- **Music**: Uses Sons of Legion tracks as native audio hooks
- **Voice**: Gritty, real, strategic; slight southern cadence optional
- **Energy**: +50% energy in delivery; high retention pacing
- **Motion**: Always show movement; avoid static talking heads

# FORMAT FINGERPRINT (30-sec structure)

**1. PURPOSE-PACKED OPENING (0-2 sec)**
- Max contrast statement: "This rock band got more streams from Netflix than TikTok"
- Immediate relevance: "If you're in a band trying to break through..."

**2. SNAP REVEAL (1-3 sec)**
- Contrarian shift: "...but we did it with zero label support"
- Max value signal: "Here's exactly how it happened..."

**3. ENERGY SEGMENT (4-20 sec)**
- Behind-the-scenes + candid clips
- Voiceover narration or real band convos
- Visual hook must carry scene (no dead air)

**4. LOOP-BASED STRUCTURE**
- Open loops: "...but what happened next almost blew it all"
- Close loop as new one opens
- Trains viewer to stay engaged

**5. CTA RESOLVES ARC (last 5 sec)**
- Recap or quote: "No label, no budget, just belief and blood. That's the game"
- CTA options: Stream the track | Follow for more | Join the Legion | Merch callout

# CONTENT SERIES ALIGNMENT

Check if video fits these Sons of Legion series concepts:
- **Legion Tactics**: Behind-the-scenes industry moves (confident, gritty, strategic)
- **Soul Behind the Song**: Stories of grit, loss, fire that inspired tracks (real, raw, emotional)
- **Brothers on the Road**: Tour clips with lessons, funny moments, arguments (rugged + vulnerable)

${platformGuide}

# YOUR ANALYSIS TASK

Analyze the provided video frames and metadata, then provide:

**1. BRAND ALIGNMENT SCORE (0-100)**
   - How well does it match SOL's "luxury-meets-rebel" identity?
   - Are brand colors (black, red, brass), text style, and visual DNA present?

**2. HOOK TYPE IDENTIFICATION**
   - Which of the 6 SOL hooks is being used (if any)?
   - How effectively is it executed?
   - Hook strength score (0-100)

**3. PSYCHOLOGY TACTICS BREAKDOWN** (score each 0-10)
   - Comprehension Maxing
   - Hawk Eye Narratives
   - Metaphors & Visual Examples
   - Common Ground
   - Simpler Words
   - Visual Stun Gun
   - Value Compression
   - Come With Proof
   - Contrast

**4. STORYTELLING STRUCTURE ANALYSIS**
   - Does it use 3-step hook format?
   - Are conflict loops present (Context → BUT → Therefore)?
   - How many loops are used?
   - Structure effectiveness score (0-100)

**5. VISUAL DNA COMPLIANCE (0-100)**
   - Color scheme alignment (black, red, brass/gold)
   - Text style (rugged serif, military stencil)
   - Energy level matching SOL's intensity
   - Motion and dynamism (no static shots)

**6. DROP-OFF PREDICTIONS**
   - Identify moments where comprehension might drop
   - Flag missing psychology tactics that would improve retention
   - Predict viewer bounce points based on lack of visual matching

**7. SONS OF LEGION-SPECIFIC RECOMMENDATIONS**
   - Don't give generic advice
   - Reference specific hook types to try
   - Cite exact psychology tactics to implement
   - Suggest visual DNA improvements (colors, text style, energy)
   - Recommend which content series it could fit into
   - Each recommendation should include: timestamp, suggestion, priority (high/medium/low), tactic name, and psychology principle

**8. CONTENT SERIES FIT**
   - Which SOL content series does this align with?
   - How can it be adapted to fit better?

**9. PLATFORM OPTIMIZATION**
   - Based on SOL brand strategy, viral potential for ${platform} (0-100)
   - Which other platforms would this work well on?
   - Specific format adjustments for ${platform}

Be ruthless but constructive. Provide specific timestamps, reference exact SOL tactics, and give actionable guidance aligned with the band's brand strategy.`;

    const userContent = [
      {
        type: "text",
        text: `Analyze this ${metadata.duration.toFixed(0)}-second video titled "${videoTitle}" for ${platform.toUpperCase()}. 
I'm providing ${frames.length} frames extracted at regular intervals.
Duration: ${metadata.duration.toFixed(2)}s
Resolution: ${metadata.width}x${metadata.height}
Target Platform: ${platform}

Provide comprehensive ${platform}-specific analysis including viral potential, format recommendations, and whether this content would work better on other platforms.`
      }
    ];

    // Add frames as images
    frames.forEach((frame: any, idx: number) => {
      userContent.push({
        type: "image_url" as const,
        image_url: {
          url: `data:image/jpeg;base64,${frame.image}`
        }
      } as any);
      userContent.push({
        type: "text",
        text: `Frame ${idx + 1} at ${frame.timestamp.toFixed(1)}s`
      });
    });

    // Call Lovable AI with tool calling for structured output
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_video_content",
              description: "Analyze video content and return structured performance metrics",
              parameters: {
                type: "object",
                properties: {
                  overallScore: {
                    type: "number",
                    description: "Overall viral potential score 0-100"
                  },
                  brandAlignmentScore: {
                    type: "number",
                    description: "How well content matches SOL brand identity 0-100"
                  },
                  hookScore: {
                    type: "number",
                    description: "First 3 seconds effectiveness score 0-100"
                  },
                  hookTypeUsed: {
                    type: "string",
                    description: "Which SOL hook type is used: Fortune Teller, Experimenter, Teacher, Magician, Investigator, Contrarian, or None"
                  },
                  pacingScore: {
                    type: "number",
                    description: "Pacing and energy consistency score 0-100"
                  },
                  visualScore: {
                    type: "number",
                    description: "Visual engagement score 0-100"
                  },
                  visualDnaScore: {
                    type: "number",
                    description: "Visual DNA compliance (colors, text, energy) 0-100"
                  },
                  psychologyTactics: {
                    type: "object",
                    description: "Score each of the 9 psychology tactics 0-10",
                    properties: {
                      comprehensionMaxing: { type: "number" },
                      hawkEyeNarratives: { type: "number" },
                      metaphors: { type: "number" },
                      commonGround: { type: "number" },
                      simplerWords: { type: "number" },
                      visualStunGun: { type: "number" },
                      valueCompression: { type: "number" },
                      comeWithProof: { type: "number" },
                      contrast: { type: "number" }
                    }
                  },
                  storytellingStructure: {
                    type: "object",
                    properties: {
                      uses3StepHook: { type: "boolean" },
                      conflictLoopsCount: { type: "number" },
                      structureScore: { type: "number", description: "0-100" }
                    }
                  },
                  contentSeriesFit: {
                    type: "string",
                    description: "Which SOL series: Legion Tactics, Soul Behind the Song, Brothers on the Road, or None"
                  },
                  dropoffPoints: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        timestamp: { type: "number" },
                        risk: { type: "number" },
                        reason: { type: "string" }
                      },
                      required: ["timestamp", "risk", "reason"]
                    }
                  },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        timestamp: { type: "number" },
                        suggestion: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        tacticName: { type: "string", description: "Name of SOL tactic/hook being recommended" },
                        psychologyPrinciple: { type: "string", description: "Why this works psychologically" }
                      },
                      required: ["timestamp", "suggestion", "priority"]
                    }
                  },
                  platformInsights: {
                    type: "object",
                    properties: {
                      viralPotential: { 
                        type: "number",
                        description: `Viral potential percentage specifically for ${platform} (0-100)`
                      },
                      bestPlatforms: {
                        type: "array",
                        items: { type: "string" },
                        description: "Other platforms this content would perform well on"
                      },
                      formatRecommendations: {
                        type: "array",
                        items: { type: "string" },
                        description: `Specific format adjustments for ${platform}`
                      }
                    }
                  }
                },
                required: ["overallScore", "brandAlignmentScore", "hookScore", "hookTypeUsed", "pacingScore", "visualScore", "visualDnaScore", "psychologyTactics", "storytellingStructure", "contentSeriesFit", "dropoffPoints", "recommendations", "platformInsights"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_video_content" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('AI credits depleted. Please add funds to your Lovable workspace.');
      }
      
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI response:', JSON.stringify(aiResponse, null, 2));

    // Extract the tool call result
    const toolCall = aiResponse.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No analysis result from AI');
    }

    const analysisResult = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        ...analysisResult,
        metadata
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in analyze-content-performance:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to analyze content',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
