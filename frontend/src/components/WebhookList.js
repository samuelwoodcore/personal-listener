import React from 'react';
import './WebhookList.css';
import { deleteWebhook } from '../services/api';

function WebhookList({ webhooks, onSelect, onDelete }) {
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this webhook?')) {
      try {
        await deleteWebhook(id);
        onDelete();
      } catch (error) {
        console.error('Failed to delete webhook:', error);
        alert('Failed to delete webhook');
      }
    }
  };

  const getWebhookUrl = (path) => {
    const baseUrl = window.location.origin.replace(':3000', ':8080');
    return `${baseUrl}/webhook/${path}`;
  };

  const copyToClipboard = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    alert('URL copied to clipboard!');
  };

  if (!webhooks || webhooks.length === 0) {
    return (
      <div className="webhook-list-empty">
        <p>No webhooks yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="webhook-list">
      {webhooks.map((webhook) => (
        <div
          key={webhook.id}
          className="webhook-card"
          onClick={() => onSelect(webhook)}
        >
          <div className="webhook-card-header">
            <h3>{webhook.name || `Webhook ${webhook.id.substring(0, 8)}`}</h3>
            <span className={`status-badge status-${webhook.responseCode}`}>
              {webhook.responseCode}
            </span>
          </div>
          <div className="webhook-card-body">
            <div className="webhook-url-section">
              <label>Webhook URL:</label>
              <div className="url-container">
                <code className="webhook-url">{getWebhookUrl(webhook.path)}</code>
                <button
                  className="btn-copy"
                  onClick={(e) => copyToClipboard(e, getWebhookUrl(webhook.path))}
                  title="Copy URL"
                >
                  📋
                </button>
              </div>
            </div>
            <div className="webhook-info">
              <div>
                <strong>Response Code:</strong> {webhook.responseCode}
              </div>
              <div>
                <strong>Response Body:</strong>{' '}
                {webhook.responseBody || '(empty)'}
              </div>
              <div>
                <strong>Created:</strong>{' '}
                {new Date(webhook.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="webhook-card-footer">
            <button
              className="btn btn-danger btn-sm"
              onClick={(e) => handleDelete(e, webhook.id)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default WebhookList;
