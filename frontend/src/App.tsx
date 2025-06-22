import React, { useState } from 'react';
import './App.css';
import CampaignsList from './components/CampaignsList';
import CampaignDetail from './components/CampaignDetail';
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
