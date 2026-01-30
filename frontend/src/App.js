import React, { useState, useEffect } from 'react';
import './App.css';
import WebhookList from './components/WebhookList';
import WebhookForm from './components/WebhookForm';
import WebhookDetail from './components/WebhookDetail';
import SearchResults from './components/SearchResults';
import { getWebhooks, createWebhook, searchEventsByReference } from './services/api';

function App() {
  const [webhooks, setWebhooks] = useState([]);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const data = await getWebhooks();
      setWebhooks(data || []);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async (name, responseCode, responseBody) => {
    try {
      const newWebhook = await createWebhook(name, responseCode, responseBody);
      setWebhooks([newWebhook, ...webhooks]);
      setShowForm(false);
      setSelectedWebhook(newWebhook);
    } catch (error) {
      console.error('Failed to create webhook:', error);
      alert('Failed to create webhook');
    }
  };

  const handleWebhookUpdated = () => {
    loadWebhooks();
  };

  const handleBack = () => {
    setSelectedWebhook(null);
    setSearchResults(null);
    setSearchQuery('');
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      setSearching(true);
      const results = await searchEventsByReference(searchQuery.trim());
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (selectedWebhook) {
    return (
      <div className="app">
        <div className="container">
          <WebhookDetail
            webhook={selectedWebhook}
            onBack={handleBack}
            onUpdate={handleWebhookUpdated}
          />
        </div>
      </div>
    );
  }

  if (searchResults !== null) {
    return (
      <div className="app">
        <div className="container">
          <SearchResults
            results={searchResults}
            query={searchQuery}
            onBack={handleBack}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>Sam's Listener</h1>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Create Webhook
          </button>
        </header>

        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              className="search-input"
              placeholder="Search by response reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={searching}>
              {searching ? 'Searching...' : '🔍 Search'}
            </button>
          </form>
        </div>

        <WebhookForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateWebhook}
        />

        <WebhookList
          webhooks={webhooks}
          onSelect={setSelectedWebhook}
          onDelete={loadWebhooks}
        />
      </div>
    </div>
  );
}

export default App;
