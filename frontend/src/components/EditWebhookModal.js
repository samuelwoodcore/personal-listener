import React, { useState } from 'react';
import './WebhookForm.css';
import Modal from './Modal';

function EditWebhookModal({ isOpen, onClose, webhook, onSave }) {
  const [name, setName] = useState(webhook?.name || '');
  const [responseCode, setResponseCode] = useState(webhook?.responseCode || 200);
  const [responseBody, setResponseBody] = useState(webhook?.responseBody || '');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (webhook) {
      setName(webhook.name || '');
      setResponseCode(webhook.responseCode);
      setResponseBody(webhook.responseBody || '');
    }
  }, [webhook]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSave(name, responseCode, responseBody);
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Webhook">
      <form className="webhook-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="editName">Webhook Name</label>
          <input
            id="editName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Webhook"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="editResponseCode">Response Code</label>
          <select
            id="editResponseCode"
            value={responseCode}
            onChange={(e) => setResponseCode(parseInt(e.target.value))}
            required
          >
            <option value={200}>200 - OK</option>
            <option value={201}>201 - Created</option>
            <option value={400}>400 - Bad Request</option>
            <option value={401}>401 - Unauthorized</option>
            <option value={404}>404 - Not Found</option>
            <option value={500}>500 - Internal Server Error</option>
            <option value={502}>502 - Bad Gateway</option>
            <option value={503}>503 - Service Unavailable</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="editResponseBody">Response Body (JSON) <span style={{fontWeight: 'normal', color: '#6b7280'}}>- Optional</span></label>
          <textarea
            id="editResponseBody"
            value={responseBody}
            onChange={(e) => setResponseBody(e.target.value)}
            placeholder='Leave empty to use a funky default message based on status code!'
            rows={6}
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default EditWebhookModal;
