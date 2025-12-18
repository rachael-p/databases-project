import React, { useMemo } from 'react';
import VisualizationPage from './VisualizationPage';
import './VisualizationPage.css';

type Category =
  | 'chemicals'
  | 'sourceReductions'
  | 'facilities'
  | 'industries'
  | 'misc';

interface CategoryPageProps {
  category: Category;
  onBack: () => void;
}

const LABELS: Record<Category, string> = {
  chemicals: 'Chemicals',
  sourceReductions: 'Source Reductions',
  facilities: 'Facilities',
  industries: 'Industries',
  misc: 'Miscellaneous',
};

const DEFAULT_QUERIES: Record<Category, string[]> = {
  chemicals: [
    'Show top chemicals by release in 2022',
    'Which chemicals released the most in Texas last year?',
  ],
  sourceReductions: [
    'Show before vs after emissions for source reductions',
    'List most effective source reduction strategies',
  ],
  facilities: [
    'Top facilities by total releases in 2022',
    'Top facilities in California by releases',
  ],
  industries: [
    'Show releases by industry in 2022',
    'Which industry releases the most overall?',
  ],
  misc: [
    'Show total releases by EPA region for 2020',
    'Cities with most air releases between 2010 and 2020',
    'Average releases by presidency',
  ],
};

const ENTITY_MAP: Record<Category, 'chemicals' | 'source_reduction' | 'facilities' | 'industries' | 'regions'> = {
  chemicals: 'chemicals',
  sourceReductions: 'source_reduction',
  facilities: 'facilities',
  industries: 'industries',
  misc: 'regions',
};

const CategoryPage: React.FC<CategoryPageProps> = ({ category, onBack }) => {
  const label = LABELS[category];
  const prompts = DEFAULT_QUERIES[category];

  const forcedEntity = useMemo(() => ENTITY_MAP[category], [category]);

  return (
    <div className="visualization-page">
      <div className="viz-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
      </div>

      <VisualizationPage
        query={prompts[0]}
        onBack={onBack}
        forcedEntity={forcedEntity}
        hideBackButton
        skipAnalysis
        label={label}
        prompts={prompts}
      />
    </div>
  );
};

export default CategoryPage;
