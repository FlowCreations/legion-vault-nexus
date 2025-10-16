import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePurchases } from '@/hooks/usePurchases';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PurchaseSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { purchaseAlbum } = usePurchases();
  const albumId = searchParams.get('album');

  useEffect(() => {
    if (albumId) {
      // Mark album as purchased
      purchaseAlbum(albumId);
    }
  }, [albumId, purchaseAlbum]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="w-24 h-24 text-green-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Purchase Successful!</h1>
          <p className="text-muted-foreground">
            Your album has been unlocked and is ready to play.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate('/music')}>
            View All Music
          </Button>
          {albumId && (
            <Button variant="outline" onClick={() => navigate(`/album/${albumId}`)}>
              Listen Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
