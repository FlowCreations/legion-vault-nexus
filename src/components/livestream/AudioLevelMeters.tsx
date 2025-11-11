import React from 'react';
import { Card } from '@/components/ui/card';
import { CompactLevelMeter } from './CompactLevelMeter';

interface AudioLevelMetersProps {
  leftLevel: number;
  rightLevel: number;
  label?: string;
}

export const AudioLevelMeters = ({ leftLevel, rightLevel, label = "Audio Levels" }: AudioLevelMetersProps) => {
  return (
    <Card className="p-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">{label}</h3>
        <div className="flex gap-2">
          <CompactLevelMeter level={leftLevel} label="L" />
          <CompactLevelMeter level={rightLevel} label="R" />
        </div>
      </div>
    </Card>
  );
};
