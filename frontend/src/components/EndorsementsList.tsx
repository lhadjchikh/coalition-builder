import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Endorsement } from '../types';
import './Endorsements.css';

interface EndorsementsListProps {
  campaignId?: number;
  refreshTrigger?: number; // Used to refresh the list when new endorsements are added
  onCountUpdate?: (count: number, recentCount?: number) => void; // Callback to update endorsement count
}

const EndorsementsList: React.FC<EndorsementsListProps> = ({
  campaignId,
  refreshTrigger,
  onCountUpdate,
}) => {
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEndorsements = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        let data: Endorsement[];
        if (campaignId) {
          data = await API.getCampaignEndorsements(campaignId);
        } else {
          data = await API.getEndorsements();
        }

        setEndorsements(data);
        // Calculate recent endorsements (last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentCount = data.filter(
          endorsement => new Date(endorsement.created_at) > oneWeekAgo
        ).length;

        // Update parent component with endorsement count and recent count
        if (onCountUpdate) {
          onCountUpdate(data.length, recentCount);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch endorsements');
      } finally {
        setLoading(false);
      }
    };

    fetchEndorsements();
  }, [campaignId, refreshTrigger]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div data-testid="endorsements-loading">Loading endorsements...</div>;
  }

  if (error) {
    return <div data-testid="endorsements-error">Error: {error}</div>;
  }

  if (endorsements.length === 0) {
    return (
      <div data-testid="no-endorsements" className="no-endorsements">
        <p>No endorsements yet. Be the first to endorse this campaign!</p>
      </div>
    );
  }

  return (
    <div className="endorsements-list" data-testid="endorsements-list">
      <h3>Endorsements ({endorsements.length})</h3>

      <div className="endorsements-grid">
        {endorsements.map(endorsement => (
          <div
            key={endorsement.id}
            className="endorsement-card"
            data-testid={`endorsement-${endorsement.id}`}
          >
            <div className="endorsement-header">
              <h4 className="stakeholder-name">{endorsement.stakeholder.name}</h4>
              <div className="stakeholder-info">
                {endorsement.stakeholder.role && (
                  <span className="role">{endorsement.stakeholder.role}, </span>
                )}
                <span className="organization">{endorsement.stakeholder.organization}</span>
                <br />
                <span className="location">
                  {endorsement.stakeholder.city}, {endorsement.stakeholder.state}
                </span>
              </div>
              <div className="stakeholder-type">
                {endorsement.stakeholder.type.charAt(0).toUpperCase() +
                  endorsement.stakeholder.type.slice(1)}
              </div>
            </div>

            {endorsement.statement && (
              <div className="endorsement-list-statement">
                <blockquote>"{endorsement.statement}"</blockquote>
              </div>
            )}

            <div className="endorsement-footer">
              <time className="endorsement-date">
                Endorsed on {formatDate(endorsement.created_at)}
              </time>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EndorsementsList;
