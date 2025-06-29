import React, { useState } from 'react';
import './App.css';
import CampaignsList from './components/CampaignsList';
import CampaignDetail from './components/CampaignDetail';
import HomePage from './components/HomePage';
import StyledHomePage from './components/StyledHomePage';
import { Campaign } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | undefined>();

  const showCampaignDetail = (campaignId: number) => {
    setSelectedCampaignId(campaignId);
    setCurrentView('detail');
  };

  const handleCampaignSelect = (campaign: Campaign) => {
    showCampaignDetail(campaign.id);
  };

  const showCampaignsList = () => {
    setCurrentView('list');
    setSelectedCampaignId(undefined);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>{process.env.REACT_APP_ORGANIZATION_NAME || 'Coalition Builder'}</h1>
        <nav>
          <button onClick={showCampaignsList} className="nav-button">
            All Campaigns
          </button>
          {currentView === 'detail' && <span className="nav-breadcrumb">→ Campaign Detail</span>}
        </nav>
      </header>
      <main className="App-main">
        {currentView === 'list' ? (
          <div>
            <CampaignsList onCampaignSelect={handleCampaignSelect} />

            {/* Enhanced Styled Homepage Demo */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <h3 className="text-xl font-semibold text-blue-800 mb-4">
                🎨 Enhanced Styled Components Homepage
              </h3>
              <p className="text-blue-700 mb-4">
                Experience the new styled-components implementation with automatic theme support,
                polished color variations, and enhanced design system.
              </p>
              <StyledHomePage onCampaignSelect={handleCampaignSelect} />
            </div>

            {/* Original Homepage Demo */}
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📋 Original Implementation
              </h3>
              <p className="text-gray-700 mb-4">
                Compare with the original Tailwind-based homepage implementation.
              </p>
              <HomePage onCampaignSelect={handleCampaignSelect} />
            </div>

            <div className="mt-8 p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-4">
                ✨ Styled Components Features
              </h3>
              <ul className="text-left max-w-2xl mx-auto text-green-700 space-y-2">
                <li>
                  • <strong>Automatic Color Variations:</strong> Primary, secondary, and accent
                  colors with auto-generated light/dark variants
                </li>
                <li>
                  • <strong>Polished Integration:</strong> Advanced color manipulation with lighten,
                  darken, and transparentize functions
                </li>
                <li>
                  • <strong>Enhanced Theme System:</strong> Comprehensive design tokens including
                  typography, spacing, shadows, and animations
                </li>
                <li>
                  • <strong>Responsive Design:</strong> Built-in breakpoint utilities and responsive
                  spacing
                </li>
                <li>
                  • <strong>Accessibility:</strong> Proper focus states and semantic color usage
                </li>
                <li>
                  • <strong>CSS Variables:</strong> Automatic generation for compatibility with
                  existing Tailwind classes
                </li>
              </ul>
            </div>

            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <h3>Frontend Endorsement Demo</h3>
              <p>
                This demonstrates the new endorsement functionality. Click "View Campaign" above to
                see:
              </p>
              <ul className="text-left max-w-xl mx-auto">
                <li>Campaign details with endorsement statement</li>
                <li>Endorsement form for stakeholders</li>
                <li>List of existing endorsements</li>
                <li>Real-time updates when new endorsements are submitted</li>
              </ul>
              <p>
                <strong>Demo Navigation:</strong> Use the campaign ID (like 1, 2, etc.) to view
                specific campaigns.
              </p>
              <div className="mt-4">
                <button onClick={() => showCampaignDetail(1)} className="m-2">
                  Demo: View Campaign 1
                </button>
                <button onClick={() => showCampaignDetail(2)} className="m-2">
                  Demo: View Campaign 2
                </button>
              </div>
            </div>
          </div>
        ) : (
          <CampaignDetail campaignId={selectedCampaignId} />
        )}
      </main>
    </div>
  );
};

export default App;
