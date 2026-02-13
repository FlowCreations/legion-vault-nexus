

# Add Cover Art Preview, Update, and Download to Music Upload Tab

## Current State
The track list in the Music Upload tab shows track metadata (title, artist, album) and has three action buttons: an upload icon (for cover art), play, and delete. However:
- The current cover art is **not displayed** next to each track, so you can't see what's already set
- The upload button replaces cover art but gives no visual feedback of the current image
- There is **no download button** for cover art

## Changes

### Update `src/components/MusicUpload.tsx`

**1. Add `image_url` to the `MusicTrack` interface**
The interface currently omits `image_url`. Add it so each track object carries its cover art URL.

**2. Show cover art thumbnail in each track card**
Add a 64x64px thumbnail to the left side of each track card showing the current cover art (or a placeholder icon if none exists). This makes it immediately visible which tracks have cover art and what it looks like.

**3. Add a "Replace Cover Art" interaction on the thumbnail**
When you hover or click the thumbnail, it will trigger the existing file input for uploading a new cover image (reusing `handleCoverArtUpload`). This replaces the current standalone upload icon with a more intuitive "click the image to change it" pattern.

**4. Add a Download button**
Add a `Download` icon button next to each track (alongside Play and Delete). When clicked, it will:
- Fetch the cover art image from its `image_url`
- Trigger a browser download with a filename like `TrackTitle-cover.png`
- Only show/enable when the track has an `image_url`

**5. Import the `Download` icon from lucide-react**
Add `Download` to the existing lucide imports, and `Image` for the placeholder when no cover art exists.

## Visual Layout (per track card)

```text
+------------------------------------------------------------------+
| [Cover Art 64x64]  Title                    [Upload] [Download] [Play] [Delete] |
|  (click to replace) Artist                                       |
|                     Album - Track # | Category | Duration | Year |
+------------------------------------------------------------------+
```

## No Database Changes
The `image_url` column already exists on `music_tracks` and is populated for all current tracks. The `thumbnails` storage bucket is already public with proper policies.

