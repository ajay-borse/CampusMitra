import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, MessageSquare, Search, GraduationCap, Sparkles, Compass, ShieldCheck } from 'lucide-react';
import { connectionApi } from '../api/connectionApi';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';
import { CardSkeleton } from '../components/SkeletonLoader';

export default function ConnectionsPage() {
  const { showToast } = useToast();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

                <div className="connection-card-actions">
                  <Link
                    to="/chat"
                    className="btn btn-primary btn-sm w-full flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={15} /> Message in Chat
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
