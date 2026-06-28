
# Streaming Links + Fan Sign-In Integration

Pure add-on to the Music page — nothing existing is replaced or removed.

## 1. Database

New migration adds artist-level streaming links + per-fan OAuth tokens.

```sql
-- Artist streaming presence (single row, edited by merchant)
CREATE TABLE public.artist_streaming_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_artist_url text,
  spotify_artist_id text,           -- parsed from URL for embed/follow API
  tidal_artist_url text,
  youtube_music_url text,
  soundcloud_url text,
  bandcamp_url text,
  featured_spotify_embed text,      -- album/playlist URL for hero embed
  featured_tidal_embed text,
  updated_at timestamptz DEFAULT now()
);
-- GRANTs + RLS: anon SELECT, admin write only

-- Fan -> Spotify connection
CREATE TABLE public.fan_streaming_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('spotify','tidal')),
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  provider_user_id text,
  display_name text,
  scopes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);
-- GRANTs + RLS: user reads/writes own row only
```

## 2. Secrets needed

Request via `add_secret`:
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- (Tidal OAuth deferred — see "Phase 2" note)

User obtains these from developer.spotify.com → create app → add redirect URI `https://<portal>/auth/spotify/callback`.

## 3. Edge functions

- `spotify-oauth-start` — builds Spotify auth URL with PKCE, scopes: `user-read-email user-follow-modify user-library-modify streaming user-read-playback-state`, returns redirect URL.
- `spotify-oauth-callback` — exchanges code → tokens, upserts `fan_streaming_connections`, redirects fan back to `/music`.
- `spotify-token-refresh` — refreshes expired access tokens on demand.
- `spotify-action` — server-side wrapper for follow-artist / save-track using stored token (keeps secret server-side).

## 4. Merchant UI (Content section)

New tab/card `StreamingLinksManager.tsx` in the merchant Content area:
- Inputs for each platform URL (Spotify artist, Tidal artist, YouTube Music, SoundCloud, Bandcamp)
- Two "Featured embed" fields (Spotify album/playlist URL, Tidal album URL) — used for the hero embed on /music
- Save button → upserts `artist_streaming_links` row
- Live preview panel showing what the embed will look like

## 5. Music page additions (add-on, nothing removed)

New section `StreamingHub.tsx` rendered above or below the existing track list (TBD by user):
- **Embed strip**: iframe embeds for any configured platform
  - Spotify: `https://open.spotify.com/embed/album/{id}` (oEmbed, no auth)
  - Tidal: `https://embed.tidal.com/albums/{id}`
  - SoundCloud / Bandcamp / YouTube Music: standard iframe embeds
- **Platform link buttons**: brand-colored buttons linking to each platform profile
- **"Connect your Spotify" card**: single button → calls `spotify-oauth-start`, opens popup, on success shows "Connected as {display_name}" + Follow Artist / Save Album quick actions powered by `spotify-action`
- Connection state hook `useStreamingConnection.ts` reads `fan_streaming_connections`

## 6. UI/visual

- Cinematic dark cards consistent with portal: onyx bg, gold accent on connected state
- Platform brand colors only on small icon dots, not full buttons (keeps look unified)
- Spotify connect button uses official "Connect with Spotify" wording per their brand guidelines

## Phase 2 (noted, not built now)

- Tidal OAuth (their API requires partner approval — embed-only for v1)
- Spotify Web Playback SDK for in-portal premium playback (separate scope-heavy effort)
- Per-track overrides

## Files touched

**New**
- `supabase/migrations/<ts>_streaming_links.sql`
- `supabase/functions/spotify-oauth-start/index.ts`
- `supabase/functions/spotify-oauth-callback/index.ts`
- `supabase/functions/spotify-token-refresh/index.ts`
- `supabase/functions/spotify-action/index.ts`
- `src/components/merchant/StreamingLinksManager.tsx`
- `src/components/music/StreamingHub.tsx`
- `src/components/music/SpotifyConnectCard.tsx`
- `src/hooks/useArtistStreamingLinks.ts`
- `src/hooks/useStreamingConnection.ts`

**Edited**
- Merchant Content tab parent → mount `StreamingLinksManager`
- `src/pages/Music.tsx` → mount `<StreamingHub />` (existing content untouched)
- `src/integrations/supabase/types.ts` (auto)
