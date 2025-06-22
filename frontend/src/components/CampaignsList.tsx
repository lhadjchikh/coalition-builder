import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Campaign } from '../types';
import './Endorsements.css';

const CampaignsList: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaigns = async (): Promise<void> => {
      try {
        const data = await API.getCampaigns();
        setCampaigns(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch campaigns');
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  if (loading) return <div data-testid="loading">Loading campaigns...</div>;
  if (error) return <div data-testid="error">{error}</div>;

  return (
    <div className="campaigns-list" data-testid="campaigns-list">
      <h2>Policy Campaigns</h2>
      {campaigns.length === 0 ? (
        <p>No campaigns found</p>
      ) : (
        <div className="campaigns-grid">
          {campaigns.map(campaign => (
            <div
              key={campaign.id}
              className="campaign-card"
              data-testid={`campaign-${campaign.id}`}
            >
              <h3>{campaign.title}</h3>
              <p className="campaign-summary">{campaign.summary}</p>

              {campaign.description && (
                <p className="campaign-description">
                  {campaign.description.length > 100
                    ? `${campaign.description.substring(0, 100)}...`
                    : campaign.description}
                </p>
              )}

              <div className="campaign-meta">
                {campaign.allow_endorsements && (
                  <span className="endorsements-allowed">✓ Accepting endorsements</span>
                )}
              </div>

              <div className="campaign-actions">
                <button
                  className="view-campaign-btn"
                  onClick={() => {
                    // For now, just show campaign ID - in a real app this would navigate
                    alert(`Navigate to campaign: ${campaign.id}`);
                  }}
                  data-testid={`view-campaign-${campaign.id}`}
                >
                  View Campaign
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignsList;
