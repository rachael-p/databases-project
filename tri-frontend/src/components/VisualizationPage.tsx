import React, { useState, useEffect, useMemo } from 'react';
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
  forcedEntity?: EntityType;
  hideBackButton?: boolean;
  skipAnalysis?: boolean;
  label?: string;
  prompts?: string[];
}

type EntityType = 'facilities' | 'chemicals' | 'source_reduction' | 'regions' | 'industries';
type ChartType = 'bar' | 'pie' | 'map';
type EndpointKey = string;

const STATE_NAME_MAP: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
};

type ParamKey =
  | 'year'
  | 'startYear'
  | 'endYear'
  | 'limit'
  | 'chem'
  | 'facility'
  | 'industry'
  | 'countMetric';

type EndpointConfig = {
  key: EndpointKey;
  label: string;
  params?: Array<ParamKey>;
  description?: string;
};

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

const VisualizationPage: React.FC<VisualizationPageProps> = ({ query, onBack, forcedEntity, hideBackButton, skipAnalysis, label, prompts }) => {
  const [inputValue, setInputValue] = useState(query);
  const [selectedEntity, setSelectedEntity] = useState<EntityType>('facilities');
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointKey>('');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [topData, setTopData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoAnalyzed, setAutoAnalyzed] = useState(false);
  const [analysisConfidence, setAnalysisConfidence] = useState<string>('');
  const [usingCustomSQL, setUsingCustomSQL] = useState(false); // Flag to prevent fetchData after custom SQL
  const [displayedQuery, setDisplayedQuery] = useState(query);
  const [generatedSql, setGeneratedSql] = useState<string | null>(null);
  
  // Basic params for queries
  const [year, setYear] = useState(2022);
  const [selectedState, setSelectedState] = useState<string>('all');
  const [limit, setLimit] = useState(10);
  const [startYear, setStartYear] = useState(2015);
  const [endYear, setEndYear] = useState(2022);
  const [selectedChem, setSelectedChem] = useState<string>('');
  const [selectedFacility, setSelectedFacility] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedPrompt, setSelectedPrompt] = useState<string | undefined>(prompts?.[0]);
  const [countMetric, setCountMetric] = useState<'num_facilities' | 'num_states' | 'num_cities'>('num_facilities');

  const [chemOptions, setChemOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [facilityOptions, setFacilityOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [industryOptions, setIndustryOptions] = useState<Array<{ id: string; name: string }>>([]);

  // Load dropdown options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [chemRes, facRes, indRes] = await Promise.all([
          axios.get('http://localhost:8000/chemicals/names'),
          axios.get('http://localhost:8000/facilities/names'),
          axios.get('http://localhost:8000/industries/names'),
        ]);
        setChemOptions(
          chemRes.data.results.map((c: any) => ({
            id: c.cas_reg_num,
            name: c.chem_name || c.cas_reg_num,
          }))
        );
        setFacilityOptions(
          facRes.data.results.map((f: any) => ({
            id: f.facility_id,
            name: f.facility_name || f.facility_id,
          }))
        );
        setIndustryOptions(
          indRes.data.results.map((i: any) => ({
            id: i.industry_code,
            name: i.industry_desc || `Industry ${i.industry_code}`,
          }))
        );
        const firstChem = chemRes.data.results?.[0]?.cas_reg_num;
        const firstFacility = facRes.data.results?.[0]?.facility_id;
        const firstIndustry = indRes.data.results?.[0]?.industry_code;
        setSelectedChem((prev) => prev || firstChem || '');
        setSelectedFacility((prev) => prev || firstFacility || '');
        setSelectedIndustry((prev) => prev || firstIndustry || '');
      } catch (err) {
        console.error('Error loading dropdown options', err);
      }
    };
    loadOptions();
  }, []);

  const endpointsByEntity: Record<EntityType, EndpointConfig[]> = {
    facilities: [
      { key: 'facilities/top-releases', label: 'Top Facilities by Total Release', params: ['year', 'limit'] },
      { key: 'facilities/releases-by-medium', label: 'Facility Releases by Medium Over Time', params: ['facility', 'startYear', 'endYear'] },
    ],
    industries: [
      { key: 'industries/releases-by-industry', label: 'Total Releases by Industry Sector', params: ['year'] },
      { key: 'industries/releases-per-medium', label: 'Industry Releases by Medium Over Time', params: ['industry', 'startYear', 'endYear'] },
    ],
    chemicals: [
      { key: 'chemicals/top-releases', label: 'Top Chemicals by Total Release', params: ['year', 'limit'] },
      { key: 'chemicals/top-carcinogens', label: 'Top Carcinogens by Total Release', params: ['year', 'limit'] },
      { key: 'chemicals/top-states', label: 'Top States for Releases of a Chemical', params: ['chem', 'year', 'limit'] },
      { key: 'chemicals/releases-over-time', label: 'Total Releases For a Chemical Over Time', params: ['chem', 'startYear', 'endYear'] },
      { key: 'chemicals/avg-carcinogens-by-region', label: 'Avg Carcinogen Releases by Region', params: ['year'] },
      { key: 'chemicals/counts-over-time', label: 'Number of Facilities/Cities/States Reporting a Chemical', params: ['chem', 'countMetric'] },
    ],
    source_reduction: [
      { key: 'sourcered/most-effective', label: 'Most Effective Reduction Strategies (100% Elimination)', params: ['limit'] },
      { key: 'sourcered/before-after', label: 'Releases Before vs After Implementation', params: ['limit'] },
      { key: 'sourcered/top-chem-by-state', label: 'Top Reduced Chemicals by State', params: ['startYear', 'endYear'] },
      { key: 'sourcered/facility-vs-strats', label: 'Facility Reduction Strategies and Effectiveness', params: ['facility', 'startYear', 'endYear'] },
      { key: 'sourcered/typical-effectiveness', label: 'Typical Effectiveness per Strategy Type' },
    ],
    regions: [
      { key: 'misc/total-per-region', label: 'Total Toxic Releases by EPA Region', params: ['year'] },
      { key: 'misc/top-cities-air-releases', label: 'Cities with Highest Air Pollution Releases', params: ['startYear', 'endYear', 'limit'] },
      { key: 'misc/top-industry-per-region', label: 'Dominant Polluting Industry by EPA Region', params: ['year'] },
      { key: 'misc/avg-releases-presidency', label: 'Average Annual Releases by Presidential Administration' },
    ],
  };

  // React to incoming query/forcedEntity changes
  useEffect(() => {
    // For LLM-driven view, show the submitted query; for category presets, keep blank
    setInputValue(skipAnalysis ? '' : query);
    setAutoAnalyzed(false);
    setAnalysisConfidence('');
    setSelectedPrompt(prompts?.[0]);
    setDisplayedQuery(query);

    if (skipAnalysis && forcedEntity) {
      setSelectedEntity(forcedEntity);
      setAutoAnalyzed(true);
      setAnalysisConfidence('');
      setGeneratedSql(null);
      return;
    }

    if (query) {
      analyzeQuery(query, forcedEntity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, forcedEntity]);

  // Reset endpoint when entity changes
  useEffect(() => {
    const first = endpointsByEntity[selectedEntity]?.[0];
    if (first) {
      setSelectedEndpoint(first.key);
    }
  }, [selectedEntity]);

  // Ensure we have a default chem when the endpoint requires one
  useEffect(() => {
    const needsChem = (endpointsByEntity[selectedEntity]?.find((e) => e.key === selectedEndpoint)?.params || []).includes('chem');
    if (needsChem && !selectedChem && chemOptions.length > 0) {
      setSelectedChem(chemOptions[0].id);
    }
  }, [selectedEndpoint, selectedEntity, selectedChem, chemOptions, endpointsByEntity]);

  // When switching into chemicals, default to first chem for endpoints like top-states/releases-over-time/counts-over-time
  useEffect(() => {
    if (selectedEntity === 'chemicals' && !selectedChem && chemOptions.length > 0) {
      setSelectedChem(chemOptions[0].id);
    }
  }, [selectedEntity, selectedChem, chemOptions]);

  const years = Array.from({ length: 11 }, (_, i) => 2024 - i); // simple year list

  // Fetch data when entity/endpoint/params change and auto-analysis is done
  useEffect(() => {
    if (query && !autoAnalyzed) {
      return;
    }
    // Skip fetching if we're using custom SQL results
    if (usingCustomSQL) {
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntity, selectedEndpoint, year, startYear, endYear, limit, selectedChem, selectedFacility, selectedIndustry, countMetric, autoAnalyzed, usingCustomSQL]);

  const runCustomSql = async (queryText: string) => {
    try {
      const nlResponse = await axios.post('http://localhost:8000/nlquery/', { query: queryText });
      const { query_type, results, sql } = nlResponse.data;

      if (query_type !== 'custom_sql' || !results) {
        return false;
      }

      const hasMeaningfulData = (results || []).some((row: any) =>
        Object.values(row || {}).some((val) => val !== null && val !== undefined && val !== '')
      );

      if (!hasMeaningfulData) {
        setTopData([]);
        setAnalysisConfidence('Custom SQL (LLM Generated)');
        setGeneratedSql(sql || null);
        setUsingCustomSQL(true);
        setDisplayedQuery(queryText);
        setAutoAnalyzed(true);
        setLoading(false);
        return true;
      }

      const transformedData: DataItem[] = (results || []).map((item: any, index: number) => {
        const name = item.year
          ? `Year ${item.year}`
          : item.region_code
          ? `Region ${item.region_code}`
          : item.state || item.city || item.chem_name || item.facility_name || `Item ${index + 1}`;

        const value = item.total_release || item.avg_release || item.count || 0;

        return {
          name: String(name),
          value: Number(value),
          ...item,
        };
      });

      setTopData(transformedData);
      setAnalysisConfidence('Custom SQL (LLM Generated)');
      setGeneratedSql(sql || null);
      setUsingCustomSQL(true);
      setDisplayedQuery(queryText);
      setAutoAnalyzed(true);
      setLoading(false);
      return true;
    } catch (nlError) {
      console.error('Custom SQL query failed:', nlError);
      return false;
    }
  };

  const analyzeQuery = async (queryText: string, overrideEntity?: EntityType) => {
    try {
      setLoading(true); // Show loading during analysis
      setGeneratedSql(null);
      setUsingCustomSQL(false);
      
      const response = await axios.post('http://localhost:8000/analyze/query', {
        query: queryText
      });
      
      const { entity_type, parameters, confidence } = response.data;
      
      console.log('Query analyzed:', { entity_type, parameters, confidence });
      const recognizedEntity = entity_type && (entity_type as EntityType) in endpointsByEntity;
      const lowOrMedium = confidence === 'low' || confidence === 'medium';
      const shouldTryCustom = lowOrMedium;

      if (shouldTryCustom) {
        const customHandled = await runCustomSql(queryText);
        setUsingCustomSQL(true);
        setAutoAnalyzed(true);
        if (customHandled) return;
      }
            
      // Auto-set parameters if provided (before setting entity to avoid multiple fetches)
      if (parameters.year) setYear(parameters.year);
      if (parameters.state) setSelectedState(parameters.state);
      if (parameters.n || parameters.limit) setLimit(parameters.n || parameters.limit);
      
      // Set confidence first
      setAnalysisConfidence(confidence);
      
      // Set entity type and mark as analyzed (this will trigger fetchData via useEffect)
      setAutoAnalyzed(true);
      const detected = (overrideEntity || entity_type) as EntityType;
      setSelectedEntity(detected);
      setDisplayedQuery(queryText);
      
      // Note: Don't set loading to false here, let fetchData handle it
    } catch (err) {
      console.error('Error analyzing query:', err);
      // Fallback to facilities if analysis fails
      setAutoAnalyzed(true);
      setSelectedEntity('facilities');
      setDisplayedQuery(queryText);
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    // fallbacks for ids
    const chemId = selectedChem || chemOptions[0]?.id;
    const facilityId = selectedFacility || facilityOptions[0]?.id;
    const industryId = selectedIndustry || industryOptions[0]?.id;

    try {
      let url = '';
      let params: Record<string, any> = {};

      switch (selectedEndpoint) {
        case 'facilities/top-releases':
          url = 'http://localhost:8000/facilities/top-releases';
          params = { year, n: limit };
          if (selectedState !== 'all') params.state = selectedState;
          break;
        case 'facilities/releases-by-medium':
          url = 'http://localhost:8000/facilities/releases-by-medium';
          if (!facilityId) throw new Error('No facility selected');
          params = { facility_id: facilityId, start_year: startYear, end_year: endYear };
          break;

        case 'industries/releases-by-industry':
          url = 'http://localhost:8000/industries/releases-by-industry';
          params = { year };
          break;
        case 'industries/releases-per-medium':
          url = 'http://localhost:8000/industries/releases-per-medium';
          if (!industryId) throw new Error('No industry selected');
          params = { industry_code: industryId, start_year: startYear, end_year: endYear };
          break;

        case 'chemicals/top-releases':
          url = 'http://localhost:8000/chemicals/top-releases';
          params = { year, n: limit };
          break;
        case 'chemicals/top-carcinogens':
          url = 'http://localhost:8000/chemicals/top-carcinogens';
          params = { year, n: limit };
          break;
        case 'chemicals/top-states':
          url = 'http://localhost:8000/chemicals/top-states';
          if (!chemId) throw new Error('No chemical selected');
          params = { chem_id: chemId, year, n: limit };
          break;
        case 'chemicals/releases-over-time':
          url = 'http://localhost:8000/chemicals/releases-over-time';
          if (!chemId) throw new Error('No chemical selected');
          params = { chem_id: chemId, start_year: startYear, end_year: endYear };
          break;
        case 'chemicals/avg-carcinogens-by-region':
          url = 'http://localhost:8000/chemicals/avg-carcinogens-by-region';
          params = { year };
          break;
        case 'chemicals/counts-over-time':
          url = 'http://localhost:8000/chemicals/counts-over-time';
          if (!chemId) throw new Error('No chemical selected');
          params = { chem_id: chemId };
          break;

        case 'sourcered/most-effective':
          url = 'http://localhost:8000/sourcered/most-effective';
          params = { limit };
          break;
        case 'sourcered/before-after':
          url = 'http://localhost:8000/sourcered/before-after';
          params = { limit };
          break;
        case 'sourcered/top-chem-by-state':
          url = 'http://localhost:8000/sourcered/top-chem-by-state';
          params = { start_year: startYear, end_year: endYear };
          break;
        case 'sourcered/facility-vs-strats':
          url = 'http://localhost:8000/sourcered/facility-vs-strats';
          if (!facilityId) throw new Error('No facility selected');
          params = { facility_id: facilityId, start_year: startYear, end_year: endYear };
          break;
        case 'sourcered/typical-effectiveness':
          url = 'http://localhost:8000/sourcered/typical-effectiveness';
          params = {};
          break;

        case 'misc/total-per-region':
          url = 'http://localhost:8000/misc/total-per-region';
          params = { year };
          break;
        case 'misc/top-cities-air-releases':
          url = 'http://localhost:8000/misc/top-cities-air-releases';
          params = { start_year: startYear, end_year: endYear, limit };
          break;
        case 'misc/top-industry-per-region':
          url = 'http://localhost:8000/misc/top-industry-per-region';
          params = { year };
          break;
        case 'misc/avg-releases-presidency':
          url = 'http://localhost:8000/misc/avg-releases-presidency';
          params = {};
          break;

        default:
          setTopData(getMockData(selectedEntity));
          setLoading(false);
          return;
      }

      const response = await axios.get(url, { params });
      const results = response.data.results || response.data;

      let transformedData: DataItem[] = [];

      switch (selectedEndpoint) {
        case 'facilities/top-releases':
          transformedData = results.map((item: any) => ({
            name: item.facility_name,
            value: item.total_release,
            state: item.state,
            facility_id: item.facility_id,
            latitude: stateCoordinates[item.state]?.lat + (Math.random() - 0.5) * 2,
            longitude: stateCoordinates[item.state]?.lng + (Math.random() - 0.5) * 2,
          }));
          break;
        case 'facilities/releases-by-medium':
          transformedData = Object.entries(results).flatMap(([yr, rows]: any) =>
            rows.map((r: any) => ({
              name: `${yr} - ${r.medium.charAt(0).toUpperCase() + r.medium.slice(1)}`,
              value: r.total_release,
              year: yr,
              medium: r.medium,
            }))
          );
          break;
        case 'industries/releases-by-industry':
          transformedData = results.map((item: any) => ({
            name: item.industry_desc || `Industry ${item.industry_code}`,
            value: item.total_release,
            industry_code: item.industry_code,
          }));
          break;
        case 'industries/releases-per-medium':
          transformedData = Object.entries(results).flatMap(([yr, rows]: any) =>
            rows.map((r: any) => ({
              name: `${yr} - ${r.medium.charAt(0).toUpperCase() + r.medium.slice(1)}`,
              value: r.total_release,
              year: yr,
              medium: r.medium,
              industry: r.industry_desc,
            }))
          );
          break;

        case 'chemicals/top-releases':
        case 'chemicals/top-carcinogens':
          transformedData = results.map((item: any) => ({
            name: item.chem_name || item.cas_reg_num,
            value: item.total_release,
            cas_reg_num: item.cas_reg_num,
          }));
          break;
        case 'chemicals/top-states':
          transformedData = results.map((item: any) => ({
            name: item.state,
            state: item.state,
            value: item.total_release,
          }));
          break;
        case 'chemicals/releases-over-time':
          transformedData = results.map((item: any) => ({
            name: `${item.year}`,
            value: item.total_release,
          }));
          break;
        case 'chemicals/avg-carcinogens-by-region':
          transformedData = results.map((item: any) => ({
            name: `Region ${item.region_code}`,
            value: item.avg_pfas_total,
          }));
          break;
        case 'chemicals/counts-over-time':
          transformedData = results.map((item: any) => ({
            name: `${item.year}`,
            value: item.num_facilities,
          }));
          break;

        case 'sourcered/most-effective':
          transformedData = results.map((item: any) => ({
            name: item.src_red_desc,
            value: Number(item.r1_count ?? item.count ?? 0),
          }));
          break;
        case 'sourcered/before-after':
          transformedData = results.map((item: any) => ({
            name: item.src_red_desc || 'Strategy',
            value: (item.total_release_before || 0) - (item.total_release_after || 0),
            facility_name: item.facility_name,
            chemical_name: item.chem_name,
            before: item.total_release_before,
            after: item.total_release_after,
          }));
          break;
        case 'sourcered/top-chem-by-state':
          transformedData = results.map((item: any) => ({
            name: `${item.state} - ${item.chem_name}`,
            value: item.occurrences,
            state: item.state,
          }));
          break;
        case 'sourcered/facility-vs-strats':
          transformedData = results.map((item: any) => ({
            name: `${item.src_red_desc} (${item.year})`,
            value: item.activity_num,
            effectiveness: item.est_annual_desc,
            chemical: item.chem_name,
          }));
          break;
        case 'sourcered/typical-effectiveness':
          transformedData = results.map((item: any) => ({
            name: item.src_red_desc,
            value: 1,
            effectiveness: item.typical_effectiveness,
          }));
          break;

        case 'misc/total-per-region':
          transformedData = results.map((item: any) => ({
            name: `Region ${item.region_code}`,
            value: item.total_release,
          }));
          break;
        case 'misc/top-cities-air-releases':
          transformedData = results.map((item: any) => ({
            name: `${item.city}, ${item.state}`,
            value: item.total_air_release,
            state: item.state,
          }));
          break;
        case 'misc/top-industry-per-region':
          transformedData = results.map((item: any) => ({
            name: `Region ${item.region_code} - ${item.industry_desc}`,
            value: item.total_release,
          }));
          break;
        case 'misc/avg-releases-presidency':
          transformedData = results.map((item: any) => ({
            name: `${item.president_name} (${item.party})`,
            value: item.avg_release,
          }));
          break;
        default:
          transformedData = getMockData(selectedEntity);
      }

      setTopData(transformedData);
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
    // Re-analyze the updated query (unless analysis is skipped)
    if (inputValue) {
      setAutoAnalyzed(false);
      if (skipAnalysis && forcedEntity) {
        setSelectedEntity(forcedEntity);
        setAutoAnalyzed(true);
      } else {
        analyzeQuery(inputValue, forcedEntity);
      }
    }
  };

  const handlePromptClick = (prompt: string) => {
    setSelectedPrompt(prompt);
    setInputValue(prompt);
    setAutoAnalyzed(false);
    if (skipAnalysis && forcedEntity) {
      setSelectedEntity(forcedEntity);
      setAutoAnalyzed(true);
    } else {
      analyzeQuery(prompt, forcedEntity);
    }
  };

  const DEFAULT_PROMPTS: Record<EntityType, string[]> = {
    chemicals: [
      'Show top chemicals by release in 2022',
      'Which chemicals released the most in Texas last year?',
      'Top states for benzene in 2020',
    ],
    source_reduction: [
      'Show before vs after emissions for source reductions',
      'List most effective source reduction strategies',
      'Which chemicals were most reduced by state between 2010 and 2020?',
    ],
    facilities: [
      'Top facilities by total releases in 2022',
      'Top facilities in California by releases',
      'Releases by medium for facility X over time',
    ],
    industries: [
      'Show releases by industry in 2022',
      'Which industry releases the most overall?',
      'Releases per medium for industry 325 over time',
    ],
    regions: [
      'Show total releases by EPA region for 2020',
      'Cities with most air releases between 2010 and 2020',
      'Average releases by presidency',
    ],
  };

  const entityLabelMap: Record<EntityType, string> = {
    chemicals: 'Chemicals',
    facilities: 'Facilities',
    industries: 'Industries',
    source_reduction: 'Source Reductions',
    regions: 'Miscellaneous',
  };

  const entityButtons: { type: EntityType; label: string; icon: string }[] = [
    { type: 'chemicals', label: 'Chemicals', icon: '⚗️' },
    { type: 'facilities', label: 'Facilities', icon: '🏭' },
    { type: 'industries', label: 'Industries', icon: '🏢' },
    { type: 'source_reduction', label: 'Source Reduction', icon: '♻️' },
    { type: 'regions', label: 'Miscellaneous', icon: '🗺️' },
  ];

  const chartButtons: { type: ChartType; label: string}[] = [
    { type: 'bar', label: 'Bar Chart'},
    { type: 'pie', label: 'Pie Chart'},
    { type: 'map', label: 'Map View'},
  ];

  const UNIT_MAP: Record<EndpointKey, string> = {
    // Facilities
    'facilities/top-releases': 'lbs',
    'facilities/releases-by-medium': 'lbs',
    // Industries
    'industries/releases-by-industry': 'lbs',
    'industries/releases-per-medium': 'lbs',
    // Chemicals
    'chemicals/top-releases': 'lbs',
    'chemicals/top-carcinogens': 'lbs',
    'chemicals/top-states': 'lbs',
    'chemicals/releases-over-time': 'lbs',
    'chemicals/avg-carcinogens-by-region': 'lbs',
    'chemicals/counts-over-time': 'count',
    // Source reductions
    'sourcered/most-effective': 'count',
    'sourcered/before-after': 'lbs',
    'sourcered/top-chem-by-state': 'count',
    'sourcered/facility-vs-strats': 'count',
    'sourcered/typical-effectiveness': 'count',
    // Misc/regions
    'misc/total-per-region': 'lbs',
    'misc/top-cities-air-releases': 'lbs',
    'misc/top-industry-per-region': 'lbs',
    'misc/avg-releases-presidency': 'lbs',
  };

  const unitLabel = useMemo(() => UNIT_MAP[selectedEndpoint] || 'value', [selectedEndpoint]);

  const currentEndpointLabel = useMemo(() => {
    const match = (endpointsByEntity[selectedEntity] || []).find((ep) => ep.key === selectedEndpoint);
    if (selectedEndpoint === 'chemicals/counts-over-time') {
      const metricLabel =
        countMetric === 'num_facilities'
          ? 'Facilities'
          : countMetric === 'num_states'
          ? 'States'
          : 'Cities';
      const chemName =
        chemOptions.find((c) => c.id === selectedChem)?.name ||
        selectedChem ||
        'this chemical';
      return `Number of ${metricLabel} - ${chemName}`;
    }
    if (
      selectedEntity === 'chemicals' &&
      ['chemicals/top-states'].includes(selectedEndpoint)
    ) {
      const chemName =
        chemOptions.find((c) => c.id === selectedChem)?.name ||
        selectedChem ||
        'this chemical';
      return match?.label ? `Top States By Releases — ${chemName}` : chemName;
    }
    if (
      selectedEntity === 'chemicals' &&
      ['chemicals/releases-over-time'].includes(selectedEndpoint)
    ) {
      const chemName =
        chemOptions.find((c) => c.id === selectedChem)?.name ||
        selectedChem ||
        'this chemical';
      return match?.label ? `Total Yearly Releases — ${chemName}` : chemName;
    }
    return match?.label || 'Results';
  }, [selectedEndpoint, selectedEntity, countMetric, chemOptions, selectedChem]);

  const formatLabel = (value: string) => {
    if (typeof value !== 'string') return value;
    return value.length > 18 ? `${value.slice(0, 18)}…` : value;
  };

  return (
    <div className="visualization-page">
      <div className="viz-header">
        {!hideBackButton && (
          <button className="back-button" onClick={onBack}>
            ← Back to Home
          </button>
        )}
      </div>

      <div className="viz-container">
        {skipAnalysis ? (
          <>
            <h1 className="viz-header">{'TRI Data Explorer Presets'}</h1>
            <div className="entity-section">
              <div className="entity-buttons">
                {entityButtons.map((btn) => (
                  <button
                    key={btn.type}
                    className={`entity-button ${selectedEntity === btn.type ? 'active' : ''}`}
                    onClick={() => {
                      setUsingCustomSQL(false);
                      setSelectedEntity(btn.type);
                    }}
                  >
                    <span className="entity-icon">{btn.icon}</span>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="parameters-section">
              <h3>Choose A Query</h3>
              <div className="parameter-controls">
                <div className="parameter-group">
                  <label htmlFor="endpoint-select">Query:</label>
                  <select
                    id="endpoint-select"
                    value={selectedEndpoint}
                    onChange={(e) => setSelectedEndpoint(e.target.value)}
                    className="parameter-select"
                  >
                    {(endpointsByEntity[selectedEntity] || []).map((ep) => (
                      <option key={ep.key} value={ep.key}>
                        {ep.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dynamic params */}
                {(endpointsByEntity[selectedEntity]?.find((e) => e.key === selectedEndpoint)?.params || []).includes('chem') && (
                  <div className="parameter-group">
                    <label htmlFor="chem-select">Chemical:</label>
                    <select
                      id="chem-select"
                      value={selectedChem || chemOptions[0]?.id || ''}
                      onChange={(e) => setSelectedChem(e.target.value)}
                      className="parameter-select"
                    >
                      {chemOptions.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(endpointsByEntity[selectedEntity]?.find((e) => e.key === selectedEndpoint)?.params || []).includes('facility') && (
                  <div className="parameter-group">
                    <label htmlFor="facility-select">Facility:</label>
                    <select
                      id="facility-select"
                      value={selectedFacility || facilityOptions[0]?.id || ''}
                      onChange={(e) => setSelectedFacility(e.target.value)}
                      className="parameter-select"
                    >
                      {facilityOptions.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(endpointsByEntity[selectedEntity]?.find((e) => e.key === selectedEndpoint)?.params || []).includes('industry') && (
                  <div className="parameter-group">
                    <label htmlFor="industry-select">Industry:</label>
                    <select
                      id="industry-select"
                      value={selectedIndustry || industryOptions[0]?.id || ''}
                      onChange={(e) => setSelectedIndustry(e.target.value)}
                      className="parameter-select"
                    >
                      {industryOptions.map((i) => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(endpointsByEntity[selectedEntity]?.find((e) => e.key === selectedEndpoint)?.params || []).includes('year') && (
                  <div className="parameter-group">
                    <label htmlFor="year-select">Year:</label>
                    <select
                      id="year-select"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="parameter-select"
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(endpointsByEntity[selectedEntity]?.find((e) => e.key === selectedEndpoint)?.params || []).includes('startYear') && (
                  <div className="parameter-group">
                    <label htmlFor="start-year-select">Start Year:</label>
                    <select
                      id="start-year-select"
                      value={startYear}
                      onChange={(e) => setStartYear(Number(e.target.value))}
                      className="parameter-select"
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(endpointsByEntity[selectedEntity]?.find((e) => e.key === selectedEndpoint)?.params || []).includes('endYear') && (
                  <div className="parameter-group">
                    <label htmlFor="end-year-select">End Year:</label>
                    <select
                      id="end-year-select"
                      value={endYear}
                      onChange={(e) => setEndYear(Number(e.target.value))}
                      className="parameter-select"
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(endpointsByEntity[selectedEntity]?.find((e) => e.key === selectedEndpoint)?.params || []).includes('limit') && (
                  <div className="parameter-group">
                    <label htmlFor="limit-select">Limit:</label>
                    <select
                      id="limit-select"
                      value={limit}
                      onChange={(e) => setLimit(Number(e.target.value))}
                      className="parameter-select"
                    >
                      {[5, 10, 25, 50, 100].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(endpointsByEntity[selectedEntity]?.find((e) => e.key === selectedEndpoint)?.params || []).includes('countMetric') && (
                  <div className="parameter-group">
                    <label htmlFor="count-metric-select">Count metric:</label>
                    <select
                      id="count-metric-select"
                      value={countMetric}
                      onChange={(e) => setCountMetric(e.target.value as 'num_facilities' | 'num_states' | 'num_cities')}
                      className="parameter-select"
                    >
                      <option value="num_facilities">Facilities</option>
                      <option value="num_states">States</option>
                      <option value="num_cities">Cities</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="submitted-query-heading">Submitted query: {displayedQuery || query || 'Enter a query to analyze'}</h1>
            {generatedSql && (
              <div className="sql-block">
                <div className="sql-title">Generated SQL</div>
                <pre>{generatedSql}</pre>
              </div>
            )}
          </>
        )}

        {/* Query Input */}
        <form onSubmit={handleNewSearch} className="query-form-viz">
          <input
            type="text"
            className="nli-query-input-viz"
            placeholder="Have another question? Enter it here..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="submit-button-viz">
            Search
          </button>
        </form>

        {/* Chart Type Selection */}
        <div className="chart-type-buttons">
          {chartButtons.map((btn) => (
            <button
              key={btn.type}
              className={`chart-type-button ${chartType === btn.type ? 'active' : ''}`}
              onClick={() => setChartType(btn.type)}
              disabled={btn.type === 'map' && !['facilities'].includes(selectedEntity)}
            >
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
              <h2>{skipAnalysis ? currentEndpointLabel : 'Results'}</h2>
              {topData.length === 0 || !topData ? (
                <div className="no-data">
                  {usingCustomSQL ? 'No results available due to lack of data' : 'No data available'}
                </div>
              ) : (
                <div className="top-list">
                  {topData.slice(0, limit).map((item, index) => (
                    <div key={index} className="list-item">
                      <span className="rank">#{index + 1}</span>
                      <div className="item-info">
                        {(() => {
                          const stateName =
                            item.state && STATE_NAME_MAP[item.state]
                              ? STATE_NAME_MAP[item.state]
                              : item.state;
                          let displayName =
                            typeof item.name === 'string'
                              ? item.name
                              : item.name !== undefined
                              ? String(item.name)
                              : 'N/A';
                          const statePrefixMatch =
                            typeof displayName === 'string' &&
                            displayName.match(/^([A-Z]{2})(\s*-\s*)(.+)/);
                          if (statePrefixMatch) {
                            const mapped = STATE_NAME_MAP[statePrefixMatch[1]] || statePrefixMatch[1];
                            displayName = `${mapped} (${statePrefixMatch[1]})${statePrefixMatch[2]}${statePrefixMatch[3]}`;
                          }
                          const stateDetail =
                            stateName && item.state ? `${stateName}` : item.state;

                          return (
                            <>
                              <span className="item-name">{displayName}</span>
                              {stateDetail && <span className="item-detail">{stateDetail}</span>}
                              {item.carcinogen && <span className="item-detail">Carcinogen: {item.carcinogen}</span>}
                            </>
                          );
                        })()}
                      </div>
                    <span className="item-value">
                        {Number(item.value ?? 0).toLocaleString()} {unitLabel !== 'value' ? unitLabel : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Visualization */}
            <div className="top-list-section">
              <h2>Visual Analysis</h2>
              <div className="chart-section">
              {chartType === 'bar' && (
                <ResponsiveContainer width="100%" height={520}>
                  <BarChart data={topData.slice(0, limit)} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-25} 
                      textAnchor="end" 
                      height={90}
                      interval={0}
                      tickMargin={12}
                      tick={{ fontSize: 12, fontWeight: 'bold' }}
                      tickFormatter={formatLabel}
                    />
                    <YAxis
                      label={{ value: unitLabel, angle: -90, position: 'insideLeft' }}
                      tick={false}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip />
                    <Bar dataKey="value" fill="#667eea" name={unitLabel} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {chartType === 'pie' && (
                <div className="chart-center">
                  <ResponsiveContainer width="90%" height={520}>
                    <PieChart>
                      <Pie
                        data={topData.slice(0, limit)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={130}
                      innerRadius={50}
                      labelLine={false}
                      label={({ name, percent }) => {
                        const pct = percent ?? 0;
                        return `${formatLabel(name || '')}: ${(pct * 100).toFixed(1)}%`;
                      }}
                    >
                      {topData.slice(0, limit).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any, entry: any) => {
                        const pct = entry && typeof entry.percent === 'number' ? entry.percent * 100 : 0;
                        const label = entry && entry.name ? entry.name : name;
                        return [`${pct.toFixed(1)}%`, formatLabel(label || '')];
                      }}
                    />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizationPage;
