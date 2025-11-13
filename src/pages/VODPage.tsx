import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { VODLibrary } from '@/components/livestream/VODLibrary';
import { VODPlayer } from '@/components/livestream/VODPlayer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function VODPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const vodId = searchParams.get('id');
  const [selectedVOD, setSelectedVOD] = useState<string | null>(vodId);

  const handleSelectVOD = (id: string) => {
    setSelectedVOD(id);
    setSearchParams({ id });
  };

  const handleBack = () => {
    setSelectedVOD(null);
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {selectedVOD ? (
          <>
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Library
            </Button>
            <VODPlayer vodId={selectedVOD} onClose={handleBack} />
          </>
        ) : (
          <VODLibrary onSelectVOD={handleSelectVOD} />
        )}
      </div>
    </div>
  );
}
