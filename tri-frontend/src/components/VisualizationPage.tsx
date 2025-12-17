import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import MapView from './MapView';
import './VisualizationPage.css';

interface VisualizationPageProps {
  query: string;
  onBack: () => void;
}

type EntityType = 'facilities' | 'chemicals' | 'source_reduction' | 'regions';
type ChartType = 'bar' | 'pie' | 'map';

interface DataItem {
  name: string;
  value: number;
  facility_name?: string;
  state?: string;
  total_release?: number;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

// Generate mock coordinates for states (simplified)
const stateCoordinates: { [key: string]: { lat: number; lng: number } } = {
  'CA': { lat: 36.7783, lng: -119.4179 },
  'TX': { lat: 31.9686, lng: -99.9018 },
  'NY': { lat: 43.2994, lng: -74.2179 },
  'FL': { lat: 27.6648, lng: -81.5158 },
  'IL': { lat: 40.6331, lng: -89.3985 },
  'PA': { lat: 41.2033, lng: -77.1945 },
  'OH': { lat: 40.4173, lng: -82.9071 },
  'MI': { lat: 44.3148, lng: -85.6024 },
  'GA': { lat: 32.1656, lng: -82.9001 },
  'NC': { lat: 35.7596, lng: -79.0193 },
};

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0', '#a8edea', '#fed6e3'];

const VisualizationPage: React.FC<VisualizationPageProps> = ({ query, onBack }) => {
  const [inputValue, setInputValue] = useState(query);
  const [selectedEntity, setSelectedEntity] = useState<EntityType>('facilities');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [topData, setTopData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Interactive parameters
  const [year, setYear] = useState(2022);
  const [selectedState, setSelectedState] = useState<string>('all');
  const [limit, setLimit] = useState(10);

  const states = ['all', 'CA', 'TX', 'NY', 'FL', 'IL', 'PA', 'OH', 'MI', 'GA', 'NC', 'MA', 'WA', 'AZ', 'TN', 'IN'];
  const years = Array.from({ length: 36 }, (_, i) => 2022 - i); // 1987-2022

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntity, year, selectedState, limit]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Connect to your friend's API
      if (selectedEntity === 'facilities') {
        const params: any = { year, limit };
        if (selectedState !== 'all') {
          params.state = selectedState;
        }
        
        const response = await axios.get('http://localhost:8000/facilities/top-releases', { params });
        
        // Transform API response to match our data structure
        const transformedData = response.data.results.map((item: any) => ({
          name: item.facility_name,
          value: item.total_release,
          state: item.state,
          facility_id: item.facility_id,
          // Add mock coordinates based on state
          latitude: stateCoordinates[item.state]?.lat + (Math.random() - 0.5) * 2,
          longitude: stateCoordinates[item.state]?.lng + (Math.random() - 0.5) * 2,
        }));
        
        setTopData(transformedData);
      } else {
        // Use mock data for other entity types (for now)
        setTopData(getMockData(selectedEntity));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data from API. Using mock data.');
      // Use mock data as fallback
      setTopData(getMockData(selectedEntity));
    } finally {
      setLoading(false);
    }
  };

  const getMockData = (type: EntityType): DataItem[] => {
    switch (type) {
      case 'facilities':
        return [
          { name: 'Facility A', value: 15000, state: 'CA', latitude: 34.05, longitude: -118.25 },
          { name: 'Facility B', value: 12000, state: 'TX', latitude: 29.76, longitude: -95.37 },
          { name: 'Facility C', value: 10500, state: 'NY', latitude: 40.71, longitude: -74.01 },
          { name: 'Facility D', value: 9800, state: 'FL', latitude: 25.76, longitude: -80.19 },
          { name: 'Facility E', value: 8500, state: 'IL', latitude: 41.88, longitude: -87.63 },
          { name: 'Facility F', value: 7200, state: 'PA', latitude: 39.95, longitude: -75.16 },
          { name: 'Facility G', value: 6800, state: 'OH', latitude: 39.10, longitude: -84.51 },
          { name: 'Facility H', value: 6200, state: 'MI', latitude: 42.33, longitude: -83.05 },
          { name: 'Facility I', value: 5500, state: 'GA', latitude: 33.75, longitude: -84.39 },
          { name: 'Facility J', value: 5000, state: 'NC', latitude: 35.78, longitude: -78.64 },
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
          { name: 'Good Operating Practices', value: 450 },
          { name: 'Process Modifications', value: 320 },
          { name: 'Raw Material Modifications', value: 280 },
          { name: 'Product Modifications', value: 210 },
          { name: 'Recycling', value: 180 },
        ];
      case 'regions':
        return [
          { name: 'Region 1', value: 35000 },
          { name: 'Region 2', value: 42000 },
          { name: 'Region 3', value: 38000 },
          { name: 'Region 4', value: 55000 },
          { name: 'Region 5', value: 48000 },
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

  const chartButtons: { type: ChartType; label: string; icon: string }[] = [
    { type: 'bar', label: 'Bar Chart', icon: '📊' },
    { type: 'pie', label: 'Pie Chart', icon: '🥧' },
    { type: 'map', label: 'Map View', icon: '🗺️' },
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

        {/* Interactive Parameters */}
        <div className="parameters-section">
          <h3>🎛️ Interactive Parameters</h3>
          <div className="parameter-controls">
            <div className="parameter-group">
              <label htmlFor="year-select">Year:</label>
              <select 
                id="year-select"
                value={year} 
                onChange={(e) => setYear(Number(e.target.value))}
                className="parameter-select"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="parameter-group">
              <label htmlFor="state-select">State:</label>
              <select 
                id="state-select"
                value={selectedState} 
                onChange={(e) => setSelectedState(e.target.value)}
                className="parameter-select"
              >
                {states.map(state => (
                  <option key={state} value={state}>
                    {state === 'all' ? 'All States' : state}
                  </option>
                ))}
              </select>
            </div>

            <div className="parameter-group">
              <label htmlFor="limit-select">Show Top:</label>
              <select 
                id="limit-select"
                value={limit} 
                onChange={(e) => setLimit(Number(e.target.value))}
                className="parameter-select"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <button onClick={fetchData} className="refresh-button">
              🔄 Refresh Data
            </button>
          </div>
        </div>

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

        {/* Chart Type Selection */}
        <div className="chart-type-buttons">
          {chartButtons.map((btn) => (
            <button
              key={btn.type}
              className={`chart-type-button ${chartType === btn.type ? 'active' : ''}`}
              onClick={() => setChartType(btn.type)}
              disabled={btn.type === 'map' && selectedEntity !== 'facilities'}
            >
              <span className="chart-icon">{btn.icon}</span>
              {btn.label}
            </button>
          ))}
        </div>

        {loading && <div className="loading">Loading data...</div>}
        {error && <div className="error">{error}</div>}

        {!loading && (
          <div className="results-section">
            {/* Top List */}
            <div className="top-list-section">
              <h2>Top {limit} {selectedEntity.charAt(0).toUpperCase() + selectedEntity.slice(1).replace('_', ' ')}</h2>
              <div className="top-list">
                {topData.slice(0, limit).map((item, index) => (
                  <div key={index} className="list-item">
                    <span className="rank">#{index + 1}</span>
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      {item.state && <span className="item-detail">State: {item.state}</span>}
                      {item.carcinogen && <span className="item-detail">Carcinogen: {item.carcinogen}</span>}
                    </div>
                    <span className="item-value">{item.value.toLocaleString()} lbs</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visualization */}
            <div className="chart-section">
              <h2>Visual Analysis</h2>
              
              {chartType === 'bar' && (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topData.slice(0, limit)} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
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
                    <Bar dataKey="value" fill="#667eea" name="Total Release (lbs)" />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {chartType === 'pie' && (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={topData.slice(0, limit)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={(entry) => `${entry.name}: ${((entry.value / topData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%`}
                    >
                      {topData.slice(0, limit).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {chartType === 'map' && selectedEntity === 'facilities' && (
                <MapView locations={topData.slice(0, limit).map(item => ({
                  facility_name: item.name,
                  state: item.state || '',
                  total_release: item.value,
                  latitude: item.latitude,
                  longitude: item.longitude,
                  city: item.city,
                  facility_id: item.facility_id
                }))} />
              )}
            </div>
          </div>
        )}

        {/* Info Panel */}
        <div className="info-panel">
          <h3>💡 Current Selection</h3>
          <p><strong>Query:</strong> {inputValue}</p>
          <p><strong>Entity Type:</strong> {selectedEntity.replace('_', ' ')}</p>
          <p><strong>Year:</strong> {year}</p>
          <p><strong>State:</strong> {selectedState === 'all' ? 'All States' : selectedState}</p>
          <p><strong>Showing:</strong> Top {limit} results</p>
          <p><strong>Chart Type:</strong> {chartType === 'bar' ? 'Bar Chart' : chartType === 'pie' ? 'Pie Chart' : 'Map View'}</p>
        </div>
      </div>
    </div>
  );
};

export default VisualizationPage;
