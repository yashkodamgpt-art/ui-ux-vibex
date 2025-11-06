
import React from 'react';

export type CampusZoneName = "All" | "Library" | "Hostel Area" | "Sports Complex" | "Mess 1" | "Academic Block";

export interface FilterChip {
  name: CampusZoneName;
  count: number;
}

interface FilterChipBarProps {
  filters: FilterChip[];
  activeFilter: CampusZoneName;
  onSelectFilter: (filter: CampusZoneName) => void;
}

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
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold shadow-md transition-all duration-200 ease-in-out snap-start
                ${isActive
                  ? 'bg-green-600 text-white scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {filter.name} ({filter.count})
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(FilterChipBar);