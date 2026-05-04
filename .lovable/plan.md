# Restore Member Nodes on the Merchant Globe

## Diagnosis

The Global Reach map in the Merchant dashboard is currently blank (no clickable user nodes) because the **app is failing to build**. TypeScript is throwing 14 errors across files that reference `NodeJS.Timeout` and `process.env`, including `GlobalReachMap.tsx` itself (line 88: `loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)`).

When the build fails, the Geography component never mounts cleanly, so no markers are drawn.

The data side is healthy:
- `user_profiles` has 568 rows, 563 with valid `latitude`/`longitude`
- The `members-geojson` edge function correctly returns a FeatureCollection with all required properties (`ptpScore`, `name`, `tier`, etc.)
- `GlobalReachMap` already has the click handler, hover panel, and `MemberProfileCard` drawer wired up

## Root Cause

`tsconfig.app.json` does not include `"node"` in its `types` array, even though `@types/node` is installed. So Node globals (`NodeJS.Timeout`, `process`) are unknown to the compiler.

## Plan

### 1. Fix the TypeScript build (unblocks the map)

Add Node types to `tsconfig.app.json`:
```json
"types": ["node", "vite/client"]
```

This single change resolves all 14 reported errors:
- `NodeJS.Timeout` references in `GlobalReachMap.tsx`, `CommunityGlobe.tsx`, `VideoPlayer.tsx`, `LiveBroadcaster.tsx`, `LiveReactions.tsx`, `useMembersGeojson.ts`, `useProgressiveLoad.ts`, `useQueryBatcher.ts`
- `process.env` references in `error-boundary-fallback.tsx`, `usePerformanceTracking.ts`, `error-handler.ts`
- `Error.captureStackTrace` in `error-handler.ts`

### 2. Verify nodes render and are clickable

After the build is green:
- Confirm the Geography tab loads the Mapbox globe
- Confirm 563 colored circle markers appear (red/yellow/green by `ptpScore`)
- Confirm hovering a node shows the name/location tooltip
- Confirm clicking a node opens the `MemberProfileCard` drawer in the top-right with the member's profile data

### 3. Small UX safeguard

If after the rebuild the click target still feels too small at globe-zoom level, bump `circle-radius` from `8` to `10` and add a subtle `circle-blur` for glow — this is a cosmetic follow-up only if needed.

## Files Changed

- `tsconfig.app.json` — add `"types": ["node", "vite/client"]`

No database, edge function, or component logic changes are required. The map and click-to-profile flow already exist; they just need a successful build to render.
