import { useState } from 'react';
import { IntelligenceNavigator } from './IntelligenceNavigator';

export function IntelligenceView() {
  const [currentView, setCurrentView] = useState<'epiphany' | 'oracle' | 'catalyst'>('epiphany');

  return (
    <div className="space-y-6">
      <IntelligenceNavigator 
        currentView={currentView}
        onSelectView={setCurrentView}
      />
    </div>
  );
}
