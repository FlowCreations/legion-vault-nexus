import { useState, useEffect } from 'react';

const STORAGE_KEY = 'sol_purchased_albums';

export function usePurchases() {
  const [purchasedAlbums, setPurchasedAlbums] = useState<string[]>([]);

  // Load purchases from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPurchasedAlbums(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse purchases:', e);
      }
    }
  }, []);

  const purchaseAlbum = (albumId: string) => {
    const updated = [...purchasedAlbums, albumId];
    setPurchasedAlbums(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const isPurchased = (albumId: string) => {
    return purchasedAlbums.includes(albumId);
  };

  const clearPurchases = () => {
    setPurchasedAlbums([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    purchasedAlbums,
    purchaseAlbum,
    isPurchased,
    clearPurchases,
  };
}
