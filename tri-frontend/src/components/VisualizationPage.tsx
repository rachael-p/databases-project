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

type EntityType = 'facilities' | 'chemicals' | 'source_reduction' | 'regions' | 'industries';
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

// US State coordinates (center of each state)
const stateCoordinates: { [key: string]: { lat: number; lng: number } } = {
  'AL': { lat: 32.3182, lng: -86.9023 }, 'AK': { lat: 64.2008, lng: -149.4937 },
  'AZ': { lat: 34.0489, lng: -111.0937 }, 'AR': { lat: 35.2010, lng: -91.8318 },
  'CA': { lat: 36.7783, lng: -119.4179 }, 'CO': { lat: 39.5501, lng: -105.7821 },
  'CT': { lat: 41.6032, lng: -73.0877 }, 'DE': { lat: 38.9108, lng: -75.5277 },
  'FL': { lat: 27.6648, lng: -81.5158 }, 'GA': { lat: 32.1656, lng: -82.9001 },
  'HI': { lat: 19.8968, lng: -155.5828 }, 'ID': { lat: 44.0682, lng: -114.7420 },
  'IL': { lat: 40.6331, lng: -89.3985 }, 'IN': { lat: 40.2672, lng: -86.1349 },
  'IA': { lat: 41.8780, lng: -93.0977 }, 'KS': { lat: 39.0119, lng: -98.4842 },
  'KY': { lat: 37.8393, lng: -84.2700 }, 'LA': { lat: 30.9843, lng: -91.9623 },
  'ME': { lat: 45.2538, lng: -69.4455 }, 'MD': { lat: 39.0458, lng: -76.6413 },
  'MA': { lat: 42.4072, lng: -71.3824 }, 'MI': { lat: 44.3148, lng: -85.6024 },
  'MN': { lat: 46.7296, lng: -94.6859 }, 'MS': { lat: 32.3547, lng: -89.3985 },
  'MO': { lat: 37.9643, lng: -91.8318 }, 'MT': { lat: 46.8797, lng: -110.3626 },
  'NE': { lat: 41.4925, lng: -99.9018 }, 'NV': { lat: 38.8026, lng: -116.4194 },
  'NH': { lat: 43.1939, lng: -71.5724 }, 'NJ': { lat: 40.0583, lng: -74.4057 },
  'NM': { lat: 34.5199, lng: -105.8701 }, 'NY': { lat: 43.2994, lng: -74.2179 },
  'NC': { lat: 35.7596, lng: -79.0193 }, 'ND': { lat: 47.5515, lng: -101.0020 },
  'OH': { lat: 40.4173, lng: -82.9071 }, 'OK': { lat: 35.4676, lng: -97.5164 },
  'OR': { lat: 43.8041, lng: -120.5542 }, 'PA': { lat: 41.2033, lng: -77.1945 },
  'RI': { lat: 41.5801, lng: -71.4774 }, 'SC': { lat: 33.8361, lng: -81.1637 },
  'SD': { lat: 43.9695, lng: -99.9018 }, 'TN': { lat: 35.5175, lng: -86.5804 },
  'TX': { lat: 31.9686, lng: -99.9018 }, 'UT': { lat: 39.3210, lng: -111.0937 },
  'VT': { lat: 44.5588, lng: -72.5778 }, 'VA': { lat: 37.4316, lng: -78.6569 },
  'WA': { lat: 47.7511, lng: -120.7401 }, 'WV': { lat: 38.5976, lng: -80.4549 },
  'WI': { lat: 43.7844, lng: -88.7879 }, 'WY': { lat: 43.0760, lng: -107.2903 },
};

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0', '#a8edea', '#fed6e3'];

const VisualizationPage: React.FC<VisualizationPageProps> = ({ query, onBack }) => {
  const [inputValue, setInputValue] = useState(query);
  const [selectedEntity, setSelectedEntity] = useState<EntityType>('facilities');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [topData, setTopData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoAnalyzed, setAutoAnalyzed] = useState(false);
  const [analysisConfidence, setAnalysisConfidence] = useState<string>('');
  
  // Interactive parameters
  const [year, setYear] = useState(2022);
  const [selectedState, setSelectedState] = useState<string>('all');
  const [limit, setLimit] = useState(10);

  const states = ['all', 'CA', 'TX', 'NY', 'FL', 'IL', 'PA', 'OH', 'MI', 'GA', 'NC', 'MA', 'WA', 'AZ', 'TN', 'IN'];
  const years = Array.from({ length: 36 }, (_, i) => 2022 - i); // 1987-2022

  // Auto-analyze query on initial load
  useEffect(() => {
    if (query && !autoAnalyzed) {
      analyzeQuery(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Fetch data when parameters change, but only after auto-analysis is complete
  useEffect(() => {
    // If we have an initial query and haven't analyzed it yet, wait
    if (query && !autoAnalyzed) {
      return; // Don't fetch data yet
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntity, year, selectedState, limit, autoAnalyzed]);

  const analyzeQuery = async (queryText: string) => {
    try {
      setLoading(true); // Show loading during analysis
      
      const response = await axios.post('http://localhost:8000/analyze/query', {
        query: queryText
      });
      
      const { entity_type, parameters, confidence } = response.data;
      
      console.log('Query analyzed:', { entity_type, parameters, confidence });
      
      // Auto-set parameters if provided (before setting entity to avoid multiple fetches)
      if (parameters.year) setYear(parameters.year);
      if (parameters.state) setSelectedState(parameters.state);
      if (parameters.n || parameters.limit) setLimit(parameters.n || parameters.limit);
      
      // Set confidence first
      setAnalysisConfidence(confidence);
      
      // Set entity type and mark as analyzed (this will trigger fetchData via useEffect)
      setAutoAnalyzed(true);
      setSelectedEntity(entity_type as EntityType);
      
      // Note: Don't set loading to false here, let fetchData handle it
    } catch (err) {
      console.error('Error analyzing query:', err);
      // Fallback to facilities if analysis fails
      setAutoAnalyzed(true);
      setSelectedEntity('facilities');
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (selectedEntity === 'facilities') {
        const params: any = { year, n: limit };
        if (selectedState !== 'all') {
          params.state = selectedState;
        }
        
        const response = await axios.get('http://localhost:8000/facilities/top-releases', { params });
        
        const transformedData = response.data.results.map((item: any) => ({
          name: item.facility_name,
          value: item.total_release,
          state: item.state,
          facility_id: item.facility_id,
          latitude: stateCoordinates[item.state]?.lat + (Math.random() - 0.5) * 2,
          longitude: stateCoordinates[item.state]?.lng + (Math.random() - 0.5) * 2,
        }));
        
        setTopData(transformedData);
      } else if (selectedEntity === 'industries') {
        // Fetch industries data
        const response = await axios.get('http://localhost:8000/industries/releases-by-industry', {
          params: { year }
        });
        
        const transformedData = response.data.results.map((item: any) => ({
          name: item.industry_desc || `Industry ${item.industry_code}`,
          value: item.total_release,
          industry_code: item.industry_code,
        })).slice(0, limit);  // Limit results
        
        setTopData(transformedData);
      } else {
        // Use mock data for other entity types
        setTopData(getMockData(selectedEntity));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data from API. Using mock data.');
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
      case 'industries':
        return [
          { name: 'Primary Metals', value: 85000 },
          { name: 'Chemicals', value: 72000 },
          { name: 'Paper', value: 58000 },
          { name: 'Petroleum', value: 45000 },
          { name: 'Plastics', value: 38000 },
          { name: 'Food', value: 25000 },
          { name: 'Transportation Equipment', value: 22000 },
          { name: 'Fabricated Metals', value: 18000 },
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
    // Re-analyze the updated query
    if (inputValue) {
      setAutoAnalyzed(false);
      analyzeQuery(inputValue);
    }
  };

  const entityButtons: { type: EntityType; label: string; icon: string }[] = [
    { type: 'facilities', label: 'Facilities', icon: '🏭' },
    { type: 'industries', label: 'Industries', icon: '🏢' },
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

        {/* Auto-Analysis Result */}
        {autoAnalyzed && analysisConfidence && (
          <div className="analysis-result">
            <span className="analysis-icon">🤖</span>
            <strong>AI Analysis:</strong> Detected query type as <strong>{selectedEntity}</strong>
            {analysisConfidence === 'high' && ' (High confidence ✅)'}
            {analysisConfidence === 'medium' && ' (Medium confidence ⚠️)'}
            {analysisConfidence === 'low' && ' (Low confidence ⚠️)'}
            <span className="analysis-hint"> - Or choose a different view below:</span>
          </div>
        )}

        {/* Entity Type Buttons - Quick View Filters */}
        <div className="entity-section">
          <h3>🔍 Quick View (Optional)</h3>
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
        </div>

        {/* Chart Type Selection */}
        <div className="chart-type-buttons">
          {chartButtons.map((btn) => (
            <button
              key={btn.type}
              className={`chart-type-button ${chartType === btn.type ? 'active' : ''}`}
              onClick={() => setChartType(btn.type)}
              disabled={btn.type === 'map' && !['facilities'].includes(selectedEntity)}
            >
              <span className="chart-icon">{btn.icon}</span>
              {btn.label}
            </button>
          ))}
        </div>

        {/* Map View Availability Notice */}
        {!['facilities'].includes(selectedEntity) && (
          <div className="map-notice">
            ℹ️ Map view is only available for <strong>Facilities</strong> (requires geographic coordinates)
          </div>
        )}

        {/* Data Source Notice */}
        <div className="data-source-notice">
          {['facilities', 'industries'].includes(selectedEntity) ? (
            <span className="real-data">✅ Showing <strong>Real Data</strong> from EPA TRI Database</span>
          ) : (
            <span className="mock-data">⚠️ Showing <strong>Mock Data</strong> (Backend API not yet implemented)</span>
          )}
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
