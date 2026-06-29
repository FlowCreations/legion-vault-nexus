## Add Category Tabs to YouTube Section

Add filter tabs (All / Videos / Shorts / Live) to the YouTube hub on the Videos page so fans can browse by content type.

### How content is classified

Piped already returns a `duration` (seconds) and stream type per item. We'll capture two extra fields in the edge function and classify on the client:

- **Shorts** — `duration ≤ 60s` OR item came from the channel's `/shorts` tab (`isShort` flag).
- **Live** — Piped stream `type === "stream"` or came from the `/streams` tab (past livestreams / VODs).
- **Videos** — everything else (standard long-form uploads).
- **All** — unfiltered (current behavior).

### Changes

**`supabase/functions/resolve-youtube-uploads/index.ts`**
- In `ingestStreams`, also persist `isShort: boolean` and `kind: "short" | "live" | "video"` per item, inferring from `s.isShort`, `s.type`, the tab the item came from, and duration as a fallback.
- Pass the originating tab name into `ingestStreams` so `/shorts` and `/streams` tab items are tagged correctly even when Piped omits the flag.
- Re-deploy the function.

**`src/components/videos/YouTubeHub.tsx`**
- Extend the `YTVideo` type with `kind` and `duration`.
- Add a tab row above the grid: `All · Videos · Shorts · Live` with counts (e.g. `Shorts (47)`), styled with the existing Onyx/Gold theme (`bg-card`, gold accent on active).
- Filter `visibleVideos` by the active tab before the `slice(0, 8)` / `View All` logic so "View All" expands only the current category.
- Show a small duration badge on each thumbnail (bottom-right pill, `mm:ss`) so Shorts are visually distinguishable.
- Preserve all existing behavior: inline modal player, YouTube sign-in button, refresh-on-focus.

### Test & verify

1. Deploy edge function, then curl it with the Sons of Legion URL to confirm `kind` is populated and the Shorts/Videos/Live split looks right.
2. Drive the `/videos` route with Playwright headless: screenshot the default grid, click each tab, screenshot to confirm the grid filters and counts match.
3. Click a Short and a long-form video to confirm the inline modal still plays inside the portal.
4. Report back the per-category counts and any issues found, then fix and re-verify.

No other files, routes, or DB changes are touched.
