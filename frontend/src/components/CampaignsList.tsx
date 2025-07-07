import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Campaign } from '../types';
import './Endorsements.css';

interface CampaignsListProps {
  onCampaignSelect?: (campaign: Campaign) => void;
}

const CampaignsList: React.FC<CampaignsListProps> = ({ onCampaignSelect }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCampaigns = async (): Promise<void> => {
      try {
        const data = await API.getCampaigns();
        if (isMounted) {
          setCampaigns(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to fetch campaigns');
          setLoading(false);
        }
      }
    };

    fetchCampaigns();

    return () => {
      isMounted = false;
    };
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
              data-testid={`campaigns-list-campaign-${campaign.id}`}
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
                  onClick={() => onCampaignSelect?.(campaign)}
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
