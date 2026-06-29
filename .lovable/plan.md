# Spotify Discography — Native Spotify Layout

Match how Spotify itself presents an artist page: a header artist embed, then a grid of album cards (cover + title), where clicking a card opens the full track list inline — instead of stacking 20+ tall iframes vertically.

## What changes

File: `src/components/music/StreamingHub.tsx` (Spotify branch only — Apple/Tidal/SoundCloud untouched)

1. **Artist header** — keep the existing Spotify artist embed at the top (top tracks / "Popular"), height 380.
2. **"Discography" album grid** — replace the current "every album as a full 420px embed" loop with a responsive grid of compact album cards:
   - 2 / 3 / 4 / 5 columns at sm / md / lg / xl
   - Each card = square cover art + album title + year, hover lift, gold ring on active
   - Cover + title pulled from Spotify's oEmbed endpoint (`https://open.spotify.com/oembed?url=...`) per album — no API key needed, runs client-side, cached in component state
3. **Inline album player** — clicking a card sets `selectedAlbumId`; a single full-width Spotify album embed (height 420, shows full track list) renders directly under the grid, replacing whatever was previously selected. Second click on the same card collapses it.
4. **Filter chips** — small chips above the grid: `All · Albums · EPs · Singles`, derived from oEmbed metadata (`type` + track count heuristic: 1 track = single, 2-6 = EP, 7+ = album). Defaults to All.
5. **Sort** — newest first by release year (from oEmbed where available, else preserve scrape order).

## Technical notes

- `resolve-spotify-discography` edge function already returns album IDs — no backend change.
- Add a small client-side fetcher that calls `https://open.spotify.com/oembed?url=https://open.spotify.com/album/<id>` per ID in parallel (capped at ~8 concurrent) to get `thumbnail_url`, `title`, and `html`. Results cached in a `useRef` map keyed by album ID so revisiting Spotify tab doesn't refetch.
- Single album embed reuses the existing `spotifyRefreshKey` so the "Refresh" + sign-in flow keeps working.
- Spotify *artist* link → new layout. Spotify *album/playlist/track* links → unchanged (single embed as today).
- Featured embeds section unchanged.

## Out of scope

- No edge-function changes
- No DB changes
- No changes to YouTube, Apple Music, Tidal, SoundCloud, Bandcamp branches
- No Spotify Web API / OAuth (oEmbed is public, no key required)

## Visual reference

```text
┌─ Spotify · Artist · Top tracks ─────────────┐
│  [artist embed — 380px, "Popular"]          │
└─────────────────────────────────────────────┘

Discography · 24 releases          [All] [Albums] [EPs] [Singles]

┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│cover │ │cover │ │cover │ │cover │ │cover │
│Album │ │Album │ │Album │ │Album │ │Album │
│ 2024 │ │ 2023 │ │ 2023 │ │ 2022 │ │ 2021 │
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘
   ▲ selected
┌─ Selected album — full track list ──────────┐
│  [album embed — 420px, all tracks]          │
└─────────────────────────────────────────────┘
```
