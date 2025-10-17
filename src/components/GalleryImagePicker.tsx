import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

// Gallery images from assets
import acousticAlbum from '@/assets/acoustic-album.jpg';
import angelsSingle from '@/assets/angels-single.jpg';
import carolinaSingle from '@/assets/carolina-single.jpg';
import outlawAlbum from '@/assets/outlaw-album.jpg';
import powerAlbum from '@/assets/power-album.jpg';
import realThangSingle from '@/assets/real-thang-single.jpg';
import strangeSingle from '@/assets/strange-single.jpg';
import strippedAlbum from '@/assets/stripped-album.jpg';
import walkingOnTheEdge from '@/assets/walking-on-the-edge.jpg';
import wildHorseSingle from '@/assets/wild-horse-single.jpg';
import show1 from '@/assets/shows/show-1.jpg';
import show2 from '@/assets/shows/show-2.jpg';
import show3 from '@/assets/shows/show-3.jpg';

const galleryImages = [
  { id: 1, url: acousticAlbum, name: 'Acoustic Album' },
  { id: 2, url: angelsSingle, name: 'Angels Single' },
  { id: 3, url: carolinaSingle, name: 'Carolina Single' },
  { id: 4, url: outlawAlbum, name: 'Outlaw Album' },
  { id: 5, url: powerAlbum, name: 'Power Album' },
  { id: 6, url: realThangSingle, name: 'Real Thang Single' },
  { id: 7, url: strangeSingle, name: 'Strange Single' },
  { id: 8, url: strippedAlbum, name: 'Stripped Album' },
  { id: 9, url: walkingOnTheEdge, name: 'Walking on the Edge' },
  { id: 10, url: wildHorseSingle, name: 'Wild Horse Single' },
  { id: 11, url: show1, name: 'Show 1' },
  { id: 12, url: show2, name: 'Show 2' },
  { id: 13, url: show3, name: 'Show 3' },
];

interface GalleryImagePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (imageUrl: string, imageName: string) => void;
}

export function GalleryImagePicker({ open, onOpenChange, onSelect }: GalleryImagePickerProps) {
  const [selected, setSelected] = useState<typeof galleryImages[0] | null>(null);

  const handleSelect = () => {
    if (selected) {
      onSelect(selected.url, selected.name);
      onOpenChange(false);
      setSelected(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Choose Gallery Image</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[500px] pr-4">
          <div className="grid grid-cols-3 gap-4">
            {galleryImages.map((image) => (
              <button
                key={image.id}
                onClick={() => setSelected(image)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  selected?.id === image.id
                    ? 'border-primary ring-2 ring-primary'
                    : 'border-transparent hover:border-muted-foreground/20'
                }`}
              >
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs">
                  {image.name}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selected}>
            Use This Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
