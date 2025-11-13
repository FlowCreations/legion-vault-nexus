import { useParams } from 'react-router-dom';
import { StreamAnalyticsDashboard } from '@/components/livestream/StreamAnalyticsDashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StreamAnalyticsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  if (!eventId) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Stream ID</h1>
          <Button onClick={() => navigate('/merchant')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto">
        <div className="border-b border-border bg-card">
          <div className="flex items-center gap-4 p-6">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/merchant')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Stream Analytics</h1>
              <p className="text-sm text-muted-foreground">Track your livestream performance</p>
            </div>
          </div>
        </div>
        
        <StreamAnalyticsDashboard eventId={eventId} />
      </div>
    </div>
  );
}
