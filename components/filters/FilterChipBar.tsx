import React from 'react';
import type { CampusZoneName } from '../../lib/campusConfig';

export interface FilterChip {
  name: CampusZoneName;
  count: number;
}

interface FilterChipBarProps {
  filters: FilterChip[];
  activeFilter: CampusZoneName;
  onSelectFilter: (filter: CampusZoneName) => void;
}

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w.org/2000/svg" className="h-4 w-4 mr-1 inline-block" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const FilterChipBar: React.FC<FilterChipBarProps> = ({ filters, activeFilter, onSelectFilter }) => {
  return (
    <div className="absolute top-16 left-0 right-0 z-[500] px-4 py-2 pointer-events-none">
      <div className="filter-chip-bar pointer-events-auto">
        {filters.map(filter => {
          const isActive = filter.name === activeFilter;
          return (
            <button
              key={filter.name}
              onClick={() => onSelectFilter(filter.name)}
              className={`flex-shrink-0 flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-md transition-all duration-200 ease-in-out snap-start
                ${isActive
                  ? 'bg-[--color-accent-primary] text-[--color-text-on-accent] scale-105'
                  : 'bg-[--color-bg-primary] text-[--color-text-primary] hover:bg-[--color-bg-tertiary]'
                }
              `}
            >
              {isActive && <CheckIcon />}
              {filter.name} ({filter.count})
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(FilterChipBar);