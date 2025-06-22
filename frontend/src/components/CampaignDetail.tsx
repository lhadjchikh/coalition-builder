import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Campaign } from '../types';
import EndorsementForm from './EndorsementForm';
import EndorsementsList from './EndorsementsList';
import './Endorsements.css';

interface CampaignDetailProps {
  campaignId?: number;
  campaignSlug?: string;
}

const CampaignDetail: React.FC<CampaignDetailProps> = ({ campaignId, campaignSlug }) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshEndorsements, setRefreshEndorsements] = useState<number>(0);

  useEffect(() => {
    const fetchCampaign = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        let data: Campaign;
        if (campaignId) {
          data = await API.getCampaignById(campaignId);
        } else if (campaignSlug) {
          data = await API.getCampaignBySlug(campaignSlug);
        } else {
          throw new Error('Either campaignId or campaignSlug must be provided');
        }

        setCampaign(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch campaign');
      } finally {
        setLoading(false);
      }
    };

    if (campaignId || campaignSlug) {
      fetchCampaign();
    }
  }, [campaignId, campaignSlug]);

  const handleEndorsementSubmitted = () => {
    // Trigger a refresh of the endorsements list
    setRefreshEndorsements(prev => prev + 1);
  };

  if (loading) {
    return <div data-testid="campaign-loading">Loading campaign...</div>;
  }

  if (error) {
    return <div data-testid="campaign-error">Error: {error}</div>;
  }

  if (!campaign) {
    return <div data-testid="campaign-not-found">Campaign not found</div>;
  }

  return (
    <div className="campaign-detail" data-testid="campaign-detail">
      <header className="campaign-header">
        <h1>{campaign.title}</h1>
        <p className="campaign-summary">{campaign.summary}</p>
      </header>

      {campaign.description && (
        <section className="campaign-description">
          <h2>About This Campaign</h2>
          <div dangerouslySetInnerHTML={{ __html: campaign.description }} />
        </section>
      )}

      <section className="campaign-endorsements">
        <div className="endorsements-container">
          <div className="endorsements-display">
            <EndorsementsList campaignId={campaign.id} refreshTrigger={refreshEndorsements} />
          </div>

          <div className="endorsement-form-container">
            <EndorsementForm
              campaign={campaign}
              onEndorsementSubmitted={handleEndorsementSubmitted}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default CampaignDetail;
