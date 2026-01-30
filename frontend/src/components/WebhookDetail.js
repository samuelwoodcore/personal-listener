import React, { useState, useEffect, useRef, useCallback } from 'react';
import './WebhookDetail.css';
import { updateWebhook, getWebhookEvents } from '../services/api';
import EditWebhookModal from './EditWebhookModal';

function WebhookDetail({ webhook, onBack, onUpdate }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef(null);
  const eventsContainerRef = useRef(null);
  const pageRef = useRef(1);

  const loadEvents = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
        pageRef.current = 1;
        setEvents([]);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : pageRef.current;
      const data = await getWebhookEvents(webhook.id, currentPage, 20);

      if (reset) {
        setEvents(data.events || []);
      } else {
        setEvents(prev => [...prev, ...(data.events || [])]);
      }

      setHasMore(data.hasMore || false);
      if (!reset) {
        pageRef.current = currentPage + 1;
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [webhook.id]);

  useEffect(() => {
    loadEvents(true);
  }, [webhook.id, loadEvents]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadEvents(false);
    }
  }, [loadingMore, hasMore, loadEvents]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentObserverRef = observerRef.current;
    if (currentObserverRef) {
      observer.observe(currentObserverRef);
    }

    return () => {
      if (currentObserverRef) {
        observer.unobserve(currentObserverRef);
      }
    };
  }, [hasMore, loadingMore, loadMore]);

  const handleSave = async (name, responseCode, responseBody) => {
    try {
      await updateWebhook(webhook.id, name, responseCode, responseBody);
      onUpdate();
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update webhook:', error);
      throw error;
    }
  };

  const getWebhookUrl = () => {
    const baseUrl = window.location.origin.replace(':3000', ':8080');
    return `${baseUrl}/webhook/${webhook.path}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const formatJSON = (str) => {
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  };

  return (
    <div className="webhook-detail">
      <div className="detail-header">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <h1>{webhook.name || 'Webhook Details'}</h1>
      </div>

      <div className="detail-layout">
        {/* Left: Config Card */}
        <div className="config-section">
          <div className="config-card">
            <div className="config-header">
              <h2>Configuration</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowEditModal(true)}>
                Edit
              </button>
            </div>

            <div className="config-content">
              <div className="config-item">
                <label>Webhook Name</label>
                <div className="config-value">
                  <strong>{webhook.name || 'Unnamed Webhook'}</strong>
                </div>
              </div>

              <div className="config-item">
                <label>Webhook URL</label>
                <div className="url-display-compact">
                  <code>{getWebhookUrl()}</code>
                  <button
                    className="btn-copy-small"
                    onClick={() => copyToClipboard(getWebhookUrl())}
                    title="Copy URL"
                  >
                    📋
                  </button>
                </div>
              </div>

              <div className="config-item">
                <label>Response Code</label>
                <div className="config-value">
                  <span className={`status-badge status-${webhook.responseCode}`}>
                    {webhook.responseCode}
                  </span>
                </div>
              </div>

              <div className="config-item">
                <label>Response Body</label>
                <div className="config-value">
                  <pre className="response-preview-compact">{webhook.responseBody || '(empty)'}</pre>
                </div>
              </div>

              <div className="config-item">
                <label>Created</label>
                <div className="config-value">
                  {new Date(webhook.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Events Card */}
        <div className="events-section">
          <div className="events-card">
            <div className="section-header">
              <h2>Historical Events</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => loadEvents(true)}>
                Refresh
              </button>
            </div>

            <div className="events-container" ref={eventsContainerRef}>
              {loading && events.length === 0 ? (
                <div className="loading">Loading events...</div>
              ) : events.length === 0 ? (
                <div className="no-events">
                  <p>No events yet. Send a request to the webhook URL to see events here.</p>
                </div>
              ) : (
                <>
                  {events.map((event) => (
                    <div key={event.id} className="event-card">
                      <div className="event-header">
                        <div className="event-header-left">
                          <span className="event-method">{event.method}</span>
                          <span className="event-timestamp">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <button
                          className="btn-expand"
                          onClick={() => setExpandedEvent(event)}
                          title="Expand view"
                        >
                          🔍
                        </button>
                      </div>
                      <div className="event-body">
                        <div className="event-section">
                          <h4>Headers</h4>
                          <pre>{JSON.stringify(event.headers || {}, null, 2)}</pre>
                        </div>
                        {event.body && (
                          <div className="event-section">
                            <h4>Body</h4>
                            <pre>{formatJSON(event.body)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {hasMore && (
                    <div ref={observerRef} className="load-more-trigger">
                      {loadingMore && <div className="loading-more">Loading more events...</div>}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <EditWebhookModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        webhook={webhook}
        onSave={handleSave}
      />

      {expandedEvent && (
        <div className="event-modal-overlay" onClick={() => setExpandedEvent(null)}>
          <div className="event-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="event-modal-header">
              <h2>Event Details</h2>
              <button className="event-modal-close" onClick={() => setExpandedEvent(null)}>×</button>
            </div>
            <div className="event-modal-body">
              <div className="event-modal-info">
                <div className="event-modal-info-item">
                  <strong>Method:</strong>
                  <span className="">{expandedEvent.method}</span>
                </div>
                <div className="event-modal-info-item">
                  <strong>Timestamp:</strong>
                  <span>{new Date(expandedEvent.timestamp).toLocaleString()}</span>
                </div>
              </div>
              <div className="event-modal-section">
                <h3>Headers</h3>
                <pre className="event-modal-pre">{JSON.stringify(expandedEvent.headers || {}, null, 2)}</pre>
              </div>
              {expandedEvent.body && (
                <div className="event-modal-section">
                  <h3>Body</h3>
                  <pre className="event-modal-pre">{formatJSON(expandedEvent.body)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WebhookDetail;
