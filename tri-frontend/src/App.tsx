import React, { useState } from 'react';
import './App.css';
import HomePage from './components/HomePage';
import VisualizationPage from './components/VisualizationPage';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'visualization'>('home');
  const [query, setQuery] = useState<string>('');

  const handleQuerySubmit = (userQuery: string) => {
    setQuery(userQuery);
    setCurrentView('visualization');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
  };

  return (
    <div className="App">
      {currentView === 'home' ? (
        <HomePage onQuerySubmit={handleQuerySubmit} />
      ) : (
        <VisualizationPage query={query} onBack={handleBackToHome} />
      )}
    </div>
  );
}

export default App;
