import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './VisualizationPage.css';

interface VisualizationPageProps {
  query: string;
  onBack: () => void;
}

type EntityType = 'facilities' | 'chemicals' | 'source_reduction' | 'regions';

interface DataItem {
  name: string;
  value: number;
  [key: string]: any;
}

const VisualizationPage: React.FC<VisualizationPageProps> = ({ query, onBack }) => {
  const [inputValue, setInputValue] = useState(query);
  const [selectedEntity, setSelectedEntity] = useState<EntityType>('facilities');
  const [topData, setTopData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch data when component mounts or query changes
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntity]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Replace with actual API endpoint
      const response = await axios.post('http://localhost:5000/api/query', {
        query: inputValue,
        entity_type: selectedEntity
      });
      
      setTopData(response.data.results || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      // Use mock data for development
      setTopData(getMockData(selectedEntity));
    } finally {
      setLoading(false);
    }
  };

  const getMockData = (type: EntityType): DataItem[] => {
    switch (type) {
      case 'facilities':
        return [
          { name: 'Facility A', value: 15000, state: 'CA' },
          { name: 'Facility B', value: 12000, state: 'TX' },
          { name: 'Facility C', value: 10500, state: 'NY' },
          { name: 'Facility D', value: 9800, state: 'FL' },
          { name: 'Facility E', value: 8500, state: 'IL' },
          { name: 'Facility F', value: 7200, state: 'PA' },
          { name: 'Facility G', value: 6800, state: 'OH' },
          { name: 'Facility H', value: 6200, state: 'MI' },
          { name: 'Facility I', value: 5500, state: 'GA' },
          { name: 'Facility J', value: 5000, state: 'NC' },
        ];
      case 'chemicals':
        return [
          { name: 'Chemical A', value: 25000, carcinogen: 'Yes' },
          { name: 'Chemical B', value: 22000, carcinogen: 'No' },
          { name: 'Chemical C', value: 18500, carcinogen: 'Yes' },
          { name: 'Chemical D', value: 15000, carcinogen: 'No' },
          { name: 'Chemical E', value: 13000, carcinogen: 'Yes' },
          { name: 'Chemical F', value: 11000, carcinogen: 'No' },
          { name: 'Chemical G', value: 9500, carcinogen: 'Yes' },
          { name: 'Chemical H', value: 8000, carcinogen: 'No' },
          { name: 'Chemical I', value: 7200, carcinogen: 'No' },
          { name: 'Chemical J', value: 6500, carcinogen: 'Yes' },
        ];
      case 'source_reduction':
        return [
          { name: 'Good Operating Practices', value: 450, count: 450 },
          { name: 'Process Modifications', value: 320, count: 320 },
          { name: 'Raw Material Modifications', value: 280, count: 280 },
          { name: 'Product Modifications', value: 210, count: 210 },
          { name: 'Recycling', value: 180, count: 180 },
          { name: 'Inventory Control', value: 150, count: 150 },
          { name: 'Spill Prevention', value: 130, count: 130 },
          { name: 'Cleaning Practices', value: 110, count: 110 },
          { name: 'Surface Preparation', value: 95, count: 95 },
          { name: 'Other', value: 75, count: 75 },
        ];
      case 'regions':
        return [
          { name: 'Region 1', value: 35000, states: 'CT,ME,MA,NH,RI,VT' },
          { name: 'Region 2', value: 42000, states: 'NJ,NY,PR,VI' },
          { name: 'Region 3', value: 38000, states: 'DE,DC,MD,PA,VA,WV' },
          { name: 'Region 4', value: 55000, states: 'AL,FL,GA,KY,MS,NC,SC,TN' },
          { name: 'Region 5', value: 48000, states: 'IL,IN,MI,MN,OH,WI' },
          { name: 'Region 6', value: 52000, states: 'AR,LA,NM,OK,TX' },
          { name: 'Region 7', value: 28000, states: 'IA,KS,MO,NE' },
          { name: 'Region 8', value: 22000, states: 'CO,MT,ND,SD,UT,WY' },
          { name: 'Region 9', value: 45000, states: 'AZ,CA,HI,NV' },
          { name: 'Region 10', value: 30000, states: 'AK,ID,OR,WA' },
        ];
      default:
        return [];
    }
  };

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const entityButtons: { type: EntityType; label: string; icon: string }[] = [
    { type: 'facilities', label: 'Facilities', icon: '🏭' },
    { type: 'chemicals', label: 'Chemicals', icon: '⚗️' },
    { type: 'source_reduction', label: 'Source Reduction', icon: '♻️' },
    { type: 'regions', label: 'EPA Regions', icon: '🗺️' },
  ];

  return (
    <div className="visualization-page">
      <div className="viz-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Home
        </button>
        <h1>TRI Data Visualization</h1>
      </div>

      <div className="viz-container">
        {/* Query Input */}
        <form onSubmit={handleNewSearch} className="query-form-viz">
          <input
            type="text"
            className="nli-query-input-viz"
            placeholder="Enter your query..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="submit-button-viz">
            Update
          </button>
        </form>

        {/* Entity Type Buttons */}
        <div className="entity-buttons">
          {entityButtons.map((btn) => (
            <button
              key={btn.type}
              className={`entity-button ${selectedEntity === btn.type ? 'active' : ''}`}
              onClick={() => setSelectedEntity(btn.type)}
            >
              <span className="entity-icon">{btn.icon}</span>
              {btn.label}
            </button>
          ))}
        </div>

        {loading && <div className="loading">Loading data...</div>}
        {error && <div className="error">{error}</div>}

        {!loading && !error && (
          <div className="results-section">
            {/* Top 10 List */}
            <div className="top-list-section">
              <h2>Top 10 {selectedEntity.charAt(0).toUpperCase() + selectedEntity.slice(1).replace('_', ' ')}</h2>
              <div className="top-list">
                {topData.map((item, index) => (
                  <div key={index} className="list-item">
                    <span className="rank">#{index + 1}</span>
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      {item.state && <span className="item-detail">State: {item.state}</span>}
                      {item.carcinogen && <span className="item-detail">Carcinogen: {item.carcinogen}</span>}
                      {item.count !== undefined && <span className="item-detail">Implementations: {item.count}</span>}
                      {item.states && <span className="item-detail-small">States: {item.states}</span>}
                    </div>
                    <span className="item-value">{item.value.toLocaleString()} lbs</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visualization */}
            <div className="chart-section">
              <h2>Visual Analysis</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    interval={0}
                  />
                  <YAxis label={{ value: 'Total Release (lbs)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#4f46e5" name="Total Release (lbs)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Info Panel */}
        <div className="info-panel">
          <h3>💡 Differentiated in some way to show that's selected</h3>
          <p>
            <strong>Current Query:</strong> {inputValue}
          </p>
          <p>
            <strong>Entity Type:</strong> {selectedEntity.replace('_', ' ')}
          </p>
          <p>
            <strong>Results:</strong> Showing top {topData.length} results
          </p>
        </div>
      </div>
    </div>
  );
};

export default VisualizationPage;

