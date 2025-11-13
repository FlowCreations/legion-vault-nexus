import { useState, Suspense } from 'react';
import { IntelligenceNavigator } from './IntelligenceNavigator';
import { OracleInsight } from './OracleInsight';
import { EpiphanyInsight } from './EpiphanyInsight';
import { CatalystDeploy } from './CatalystDeploy';

export function IntelligenceView() {
  const [currentView, setCurrentView] = useState<'epiphany' | 'oracle' | 'catalyst'>('epiphany');

  return (
    <div className="space-y-6">
      <IntelligenceNavigator 
        currentView={currentView}
        onSelectView={setCurrentView}
      />

      <div className="min-h-[400px]">
        {currentView === 'epiphany' && (
          <Suspense fallback={<div className="text-center py-8">Loading Epiphany...</div>}>
            <EpiphanyInsight />
          </Suspense>
        )}

        {currentView === 'oracle' && (
          <Suspense fallback={<div className="text-center py-8">Loading Oracle...</div>}>
            <OracleInsight />
          </Suspense>
        )}

        {currentView === 'catalyst' && (
          <Suspense fallback={<div className="text-center py-8">Loading Catalyst...</div>}>
            <CatalystDeploy />
          </Suspense>
        )}
      </div>
    </div>
  );
}
