import React from 'react';
import './SearchResults.css';

function SearchResults({ results, query, onBack }) {
  const formatJSON = (str) => {
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  };

  return (
    <div className="search-results">
      <div className="search-results-header">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <h1>Search Results</h1>
        <div className="search-query">
          Reference: <code>{query}</code>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="no-results">
          <p>No events found with reference: <code>{query}</code></p>
        </div>
      ) : (
        <div className="results-list">
          {results.map((event) => (
            <div key={event.id} className="result-card">
              <div className="result-header">
                <div className="result-header-left">
                  <span className="event-method">{event.method}</span>
                  <span className="result-webhook-name">{event.webhookName || 'Unnamed Webhook'}</span>
                  <span className="result-timestamp">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="result-body">
                <div className="result-section">
                  <h4>Headers</h4>
                  <pre>{JSON.stringify(event.headers || {}, null, 2)}</pre>
                </div>
                {event.body && (
                  <div className="result-section">
                    <h4>Body</h4>
                    <pre>{formatJSON(event.body)}</pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchResults;
