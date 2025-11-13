import { useState } from 'react';
import { IntelligenceNavigator } from './IntelligenceNavigator';
import { EpiphanyInsight } from './EpiphanyInsight';
import { OracleInsight } from './OracleInsight';
import { CatalystDeploy } from './CatalystDeploy';

export function IntelligenceView() {
  const [currentView, setCurrentView] = useState<'epiphany' | 'oracle' | 'catalyst' | null>(null);

  return (
    <div className="space-y-8">
      <IntelligenceNavigator 
        currentView={currentView}
        onSelectView={setCurrentView}
      />
      
      {/* Intelligence content with fade-in animation */}
      {currentView && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          {currentView === 'epiphany' && <EpiphanyInsight />}
          {currentView === 'oracle' && <OracleInsight />}
          {currentView === 'catalyst' && <CatalystDeploy />}
        </div>
      )}
    </div>
  );
}
