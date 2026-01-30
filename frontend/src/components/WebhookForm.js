import React, { useState } from 'react';
import './WebhookForm.css';
import Modal from './Modal';

function WebhookForm({ isOpen, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [responseCode, setResponseCode] = useState(200);
  const [responseBody, setResponseBody] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(name, responseCode, responseBody);
    setName('');
    setResponseCode(200);
    setResponseBody('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Webhook">
      <form className="webhook-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Webhook Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Webhook"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="responseCode">Response Code</label>
          <select
            id="responseCode"
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
          <label htmlFor="responseBody">Response Body (JSON) <span style={{fontWeight: 'normal', color: '#6b7280'}}>- Optional</span></label>
          <textarea
            id="responseBody"
            value={responseBody}
            onChange={(e) => setResponseBody(e.target.value)}
            placeholder='Leave empty to use a funky default message based on status code!'
            rows={6}
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Create Webhook
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default WebhookForm;
