import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  MessageSquare,
  Search,
  GraduationCap,
  Sparkles,
  Compass,
  ShieldCheck,
  Zap,
  X,
  Check,
} from 'lucide-react';
import { connectionApi } from '../api/connectionApi';
import { vibeApi } from '../api/vibeApi';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';
import { CardSkeleton } from '../components/SkeletonLoader';

export default function ConnectionsPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Vibe Breakdown Modal State
  const [vibePartner, setVibePartner] = useState(null);
  const [vibeData, setVibeData] = useState(null);
  const [vibeLoading, setVibeLoading] = useState(false);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const res = await connectionApi.getConnections();
      if (res?.success) {
        setConnections(res.data || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load connections', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleOpenVibe = async (conn) => {
    const targetUserId = conn.userId || conn.user?._id;
    if (!targetUserId) return;
    setVibePartner(conn);
    setVibeLoading(true);
    try {
      const res = await vibeApi.getProfileVibe(targetUserId);
      if (res?.success) {
        setVibeData(res.data);
      }
    } catch {
      showToast('Could not load vibe breakdown.', 'error');
    } finally {
      setVibeLoading(false);
    }
  };

  const filteredConnections = connections.filter((conn) => {
    const name = (conn.name || `${conn.user?.firstName || ''} ${conn.user?.lastName || ''}`).toLowerCase();
    const prog = (conn.program || conn.profile?.program || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return name.includes(query) || prog.includes(query);
  });

  return (
    <div className="connections-page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Users className="text-primary" /> Campus Connections & Matches 💜
          </h2>
          <p className="page-subtitle">
            Mutual matches and peer connections ready to study, hang out, or chat.
          </p>
        </div>

        {/* Search Filter */}
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search connections by name or program..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Connections */}
      {loading ? (
        <div className="connections-grid">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredConnections.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="💫"
            title={searchTerm ? 'No matching connections found' : 'Your people are out there 💫'}
            description={
              searchTerm
                ? 'Try a different search term or degree name.'
                : 'Mutual connections happen when you and another student both connect on the Discovery Deck. Try adding more interests to improve your matches!'
            }
            actionLabel={searchTerm ? 'Clear Search' : 'Go to Discovery Deck ✨'}
            onAction={
              searchTerm
                ? () => setSearchTerm('')
                : () => (window.location.href = '/discover')
            }
          />
        </div>
      ) : (
        <div className="connections-grid">
          {filteredConnections.map((conn) => {
            const partnerName = conn.name || `${conn.user?.firstName || ''} ${conn.user?.lastName || ''}`;
            const partnerPhoto = conn.avatar || conn.photos?.[0] || conn.profile?.photos?.[0];
            const partnerProgram = conn.program || conn.profile?.program || 'MIT-WPU Student';
            const partnerBio = conn.bio || conn.profile?.bio;
            const partnerInterests = conn.interests || conn.profile?.interests || [];
            const isVerified = conn.isVerified || conn.user?.isVerified;

            return (
              <div key={conn.id || conn._id || conn.userId} className="connection-card anim-zoom-in">
                <div className="connection-card-header">
                  <div className="connection-avatar">
                    {partnerPhoto ? (
                      <img src={partnerPhoto} alt={partnerName} />
                    ) : (
                      <span>{partnerName?.[0] || 'S'}</span>
                    )}
                  </div>
                  <div className="connection-card-info">
                    <h4 className="connection-name flex items-center gap-1">
                      {partnerName}
                      {isVerified && <ShieldCheck size={14} className="text-emerald-400" title="Verified Student" />}
                    </h4>
                    <div className="connection-academic text-xs text-muted">
                      <GraduationCap size={13} className="inline mr-1" />
                      {partnerProgram}
                    </div>
                  </div>
                </div>

                {partnerBio && (
                  <p className="connection-bio text-xs line-clamp-2">
                    &ldquo;{partnerBio}&rdquo;
                  </p>
                )}

                {partnerInterests && partnerInterests.length > 0 && (
                  <div className="connection-tags">
                    {partnerInterests.slice(0, 3).map((item, idx) => (
                      <span key={idx} className="chip chip-sm">
                        {item}
                      </span>
                    ))}
                    {partnerInterests.length > 3 && (
                      <span className="text-xs text-muted">
                        +{partnerInterests.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="connection-card-actions flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm flex-1 flex items-center justify-center gap-1"
                    onClick={() => handleOpenVibe(conn)}
                  >
                    <Zap size={14} className="text-violet" /> Vibe Check
                  </button>
                  <Link
                    to="/chat"
                    className="btn btn-primary btn-sm flex-1 flex items-center justify-center gap-1"
                  >
                    <MessageSquare size={14} /> Chat
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vibe Breakdown Modal */}
      {vibePartner && (
        <div className="modal-overlay" onClick={() => setVibePartner(null)}>
          <div
            className="modal-content vibe-drawer-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Zap size={20} className="text-violet" />
                <h3 className="modal-title font-bold">
                  Shared Vibe: {vibePartner.name || vibePartner.firstName}
                </h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setVibePartner(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="vibe-drawer-body p-4">
              {vibeLoading ? (
                <div className="py-6 text-center text-muted">Calculating shared vibe...</div>
              ) : (
                <>
                  <div className="vibe-section-box">
                    <h4 className="vibe-section-title">
                      <Sparkles size={16} className="text-secondary" /> Why You Two Matched
                    </h4>
                    <div className="shared-vibe-list mt-2">
                      {vibeData?.sharedVibe?.explanations?.map((exp, idx) => (
                        <div key={idx} className="shared-vibe-item">
                          <Check size={15} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{exp}</span>
                        </div>
                      ))}
                    </div>

                    {vibeData?.sharedVibe?.sharedInterests?.length > 0 && (
                      <div className="shared-tags-row mt-3">
                        <span className="text-xs text-muted">Shared Interests:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {vibeData.sharedVibe.sharedInterests.map((interest, i) => (
                            <span key={i} className="chip chip-sm">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="vibe-section-box mt-3">
                    <h4 className="vibe-section-title">
                      <MessageSquare size={16} className="text-violet" /> Suggested Icebreakers
                    </h4>
                    <div className="vibe-prompts-list mt-2">
                      {vibeData?.icebreakers?.prompts?.slice(0, 3).map((prompt, idx) => (
                        <div key={idx} className="vibe-prompt-card">
                          <span className="text-sm font-medium">{prompt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Link
                      to="/chat"
                      className="btn btn-primary btn-sm flex items-center gap-1.5"
                    >
                      <MessageSquare size={14} /> Open in Chat
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
