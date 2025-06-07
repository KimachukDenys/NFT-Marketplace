import React, { useState,  useRef } from 'react';
import './NftFilters.css';

interface Filters {
  searchQuery: string;
  minPrice: string;
  maxPrice: string;
  sortBy: 'price-asc' | 'price-desc' | 'newest';
}

interface NftFiltersProps {
  onFilterChange: (filters: Filters) => void;
  minAvailablePrice: number;
  maxAvailablePrice: number;
}

export const NftFilters: React.FC<NftFiltersProps> = ({
  onFilterChange,
  minAvailablePrice,
  maxAvailablePrice,
}) => {
  const [filters, setFilters] = useState<Filters>({
    searchQuery: '',
    minPrice: minAvailablePrice.toString(),
    maxPrice: maxAvailablePrice.toString(),
    sortBy: 'newest',
  });

  const [sliderValues, setSliderValues] = useState({
    min: minAvailablePrice,
    max: maxAvailablePrice,
  });

  const progressRef = useRef<HTMLDivElement>(null);

  // Обновлення фільтрів і slider values синхронно
  const updateFilters = (newMin: number, newMax: number) => {
    const fixedMin = Math.min(newMin, newMax);
    const fixedMax = Math.max(newMin, newMax);
    setSliderValues({ min: fixedMin, max: fixedMax });
    const newFilters = {
      ...filters,
      minPrice: fixedMin.toString(),
      maxPrice: fixedMax.toString(),
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'minPrice') {
      let val = parseFloat(value) || minAvailablePrice;
      if (val < minAvailablePrice) val = minAvailablePrice;
      if (val > sliderValues.max) val = sliderValues.max;
      updateFilters(val, sliderValues.max);
    } else if (name === 'maxPrice') {
      let val = parseFloat(value) || maxAvailablePrice;
      if (val > maxAvailablePrice) val = maxAvailablePrice;
      if (val < sliderValues.min) val = sliderValues.min;
      updateFilters(sliderValues.min, val);
    } else if (name === 'searchQuery' || name === 'sortBy') {
      const newFilters = { ...filters, [name]: value };
      setFilters(newFilters);
      onFilterChange(newFilters);
    }
  };

  // Рендер прогресу між двома ручками
  const minPercent = ((sliderValues.min - minAvailablePrice) / (maxAvailablePrice - minAvailablePrice)) * 100;
  const maxPercent = ((sliderValues.max - minAvailablePrice) / (maxAvailablePrice - minAvailablePrice)) * 100;

  return (
    <div className="filters-container">
      <div className="filter-group">
        <label htmlFor="searchQuery">Пошук за назвою</label>
        <input
          type="text"
          id="searchQuery"
          name="searchQuery"
          value={filters.searchQuery}
          onChange={handleInputChange}
          placeholder="Введіть назву NFT..."
        />
      </div>

      <div className="filter-group price-range">
        <label>Ціновий діапазон (ETH)</label>
        <div className="price-slider">
          <input
            type="range"
            min={minAvailablePrice}
            max={maxAvailablePrice}
            value={sliderValues.min}
            onChange={(e) => updateFilters(Number(e.target.value), sliderValues.max)}
            step={0.01}
            className="slider min-slider"
          />
          <input
            type="range"
            min={minAvailablePrice}
            max={maxAvailablePrice}
            value={sliderValues.max}
            onChange={(e) => updateFilters(sliderValues.min, Number(e.target.value))}
            step={0.01}
            className="slider max-slider"
          />

          {/* Прогресбар між двома ручками */}
          <div
            ref={progressRef}
            className="progress"
            style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
          />
        </div>

        <div className="price-inputs">
          <input
            type="number"
            name="minPrice"
            value={filters.minPrice}
            onChange={handleInputChange}
            min={minAvailablePrice}
            max={maxAvailablePrice}
            step={0.01}
          />
          <span>-</span>
          <input
            type="number"
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleInputChange}
            min={minAvailablePrice}
            max={maxAvailablePrice}
            step={0.01}
          />
        </div>
      </div>

      <div className="filter-group">
        <label htmlFor="sortBy">Сортування</label>
        <select id="sortBy" name="sortBy" value={filters.sortBy} onChange={handleInputChange}>
          <option value="newest">Спочатку нові</option>
          <option value="price-asc">Ціна (за зростанням)</option>
          <option value="price-desc">Ціна (за спаданням)</option>
        </select>
      </div>
    </div>
  );
};
