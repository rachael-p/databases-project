import React, { useState } from 'react';
import './HomePage.css';

interface HomePageProps {
  onQuerySubmit: (query: string) => void;
  onNavigateSection: (section: 'chemicals' | 'sourceReductions' | 'facilities' | 'industries' | 'misc') => void;
}

const HomePage: React.FC<HomePageProps> = ({ onQuerySubmit, onNavigateSection }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onQuerySubmit(inputValue);
    }
  };

  const handleExampleClick = (example: string) => {
    setInputValue(example);
    onQuerySubmit(example);
  };

  const exampleQueries = [
    "Show releases by industry in 2024",
    "Show top 10 chemicals by release in 2022",
    "Show total releases by EPA region"
  ];

  return (
    <div className="home-page">
      <div className="home-container">
        <h1 className="home-title">EPA TRI Data Explorer</h1>
        <p className="home-subtitle">
          Explore toxic chemical releases using natural language queries
        </p>

        <form onSubmit={handleSubmit} className="query-form">
          <div className="input-wrapper">
            <input
              type="text"
              className="nli-query-input"
              placeholder="Ask a question about toxic releases... (e.g., 'Show top facilities in California')"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button type="submit" className="submit-button">
              Search
            </button>
          </div>
        </form>

        <div className="examples-section">
          <p className="examples-title">Not sure where to start? Try these examples:</p>
          <div className="examples-grid">
            {exampleQueries.map((example, index) => (
              <button
                key={index}
                className="example-button"
                onClick={() => handleExampleClick(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="info-section">
          <h3>Or explore our preset queries:</h3>
          <div className="info-cards">
            <button className="info-card" onClick={() => onNavigateSection('chemicals')}>
              <span className="info-icon">⚗️</span>
              <h4>Chemicals</h4>
              <p>Toxic chemicals and their properties</p>
            </button>
            <button className="info-card" onClick={() => onNavigateSection('facilities')}>
              <span className="info-icon">🏭</span>
              <h4>Facilities</h4>
              <p>Industrial facilities reporting toxic releases</p>
            </button>
            <button className="info-card" onClick={() => onNavigateSection('industries')}>
              <span className="info-icon">🏢</span>
              <h4>Industries</h4>
              <p>Sector-level release trends</p>
            </button>
            <button className="info-card" onClick={() => onNavigateSection('sourceReductions')}>
              <span className="info-icon">♻️</span>
              <h4>Source Reductions</h4>
              <p>Pollution prevention activities</p>
            </button>
            <button className="info-card" onClick={() => onNavigateSection('misc')}>
              <span className="info-icon">📊</span>
              <h4>Misc</h4>
              <p>Regional and presidency-based views</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
