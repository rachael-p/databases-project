import React, { useState } from 'react';
import './App.css';
import HomePage from './components/HomePage';
import VisualizationPage from './components/VisualizationPage';
import CategoryPage from './components/CategoryPage';

type View =
  | 'home'
  | 'visualization'
  | 'chemicals'
  | 'sourceReductions'
  | 'facilities'
  | 'industries'
  | 'misc';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [query, setQuery] = useState<string>('');

  const handleQuerySubmit = (userQuery: string) => {
    setQuery(userQuery);
    setCurrentView('visualization');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
  };

  const handleNavigateSection = (section: View) => {
    setCurrentView(section);
  };

  const renderView = () => {
    if (currentView === 'home') {
      return (
        <HomePage
          onQuerySubmit={handleQuerySubmit}
          onNavigateSection={handleNavigateSection}
        />
      );
    }

    if (currentView === 'visualization') {
      return <VisualizationPage query={query} onBack={handleBackToHome} />;
    }

    return (
      <CategoryPage
        category={currentView}
        onBack={handleBackToHome}
      />
    );
  };

  return (
    <div className="App">
      {renderView()}
    </div>
  );
}

export default App;
