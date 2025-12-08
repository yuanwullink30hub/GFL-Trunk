import React, { useState, useEffect } from 'react';
import './App.css';
import TabNavigation from './components/TabNavigation';
import ContentPanel from './components/ContentPanel';

function App() {
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load content from JSON file
  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch('/content.json');
        if (!response.ok) {
          throw new Error('Failed to load content');
        }
        const data = await response.json();
        setTabs(data.tabs);
        // Set the first tab as active by default
        if (data.tabs.length > 0) {
          setActiveTab(data.tabs[0].id);
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  if (loading) {
    return <div className="container"><p>Loading...</p></div>;
  }

  if (error) {
    return <div className="container error"><p>Error: {error}</p></div>;
  }

  return (
    <div className="App">
      <header className="header">
        <h1>Garden For Life</h1>
      </header>
      
      <div className="container">
        <TabNavigation 
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        {activeTabData && (
          <ContentPanel data={activeTabData} />
        )}
      </div>
    </div>
  );
}

export default App;
