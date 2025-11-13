import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Scissors } from 'lucide-react';

interface CreateHighlightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  currentTime: number;
  streamStartTime?: Date;
}

export function CreateHighlightDialog({
  open,
  onOpenChange,
  eventId,
  currentTime,
  streamStartTime
}: CreateHighlightDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState(Math.max(0, currentTime - 30));
  const [endTime, setEndTime] = useState(currentTime);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (startTime >= endTime) {
      toast.error('End time must be after start time');
      return;
    }

    if (endTime - startTime > 300) {
      toast.error('Highlights cannot be longer than 5 minutes');
      return;
    }

    setIsCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('livestream_highlights')
        .insert({
          event_id: eventId,
          created_by: user?.id,
          title: title.trim(),
          description: description.trim() || null,
          start_time_seconds: Math.floor(startTime),
          end_time_seconds: Math.floor(endTime)
        });

      if (error) throw error;

      toast.success('Highlight created successfully!');
      onOpenChange(false);
      setTitle('');
      setDescription('');
      setStartTime(Math.max(0, currentTime - 30));
      setEndTime(currentTime);
    } catch (error) {
      console.error('Error creating highlight:', error);
      toast.error('Failed to create highlight');
    } finally {
      setIsCreating(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            Create Stream Highlight
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Epic comeback moment"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="number"
                value={startTime}
                onChange={(e) => setStartTime(Number(e.target.value))}
                min={0}
                max={currentTime}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formatTime(startTime)}
              </p>
            </div>

            <div>
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="number"
                value={endTime}
                onChange={(e) => setEndTime(Number(e.target.value))}
                min={startTime + 1}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formatTime(endTime)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-medium">{formatTime(endTime - startTime)}</span>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="gap-2"
            >
              <Scissors className="w-4 h-4" />
              {isCreating ? 'Creating...' : 'Create Highlight'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
