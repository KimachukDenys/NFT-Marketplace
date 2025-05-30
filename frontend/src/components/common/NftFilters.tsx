import React, { useState, useEffect } from 'react';


interface NftFiltersProps {
  onFilterChange: (filters: Filters) => void;
  minAvailablePrice: number;
  maxAvailablePrice: number;
}

export const NftFilters: React.FC<NftFiltersProps> = ({ 
  onFilterChange, 
  minAvailablePrice, 
  maxAvailablePrice 
}) => {
  const [filters, setFilters] = useState<Filters>({
    searchQuery: '',
    minPrice: minAvailablePrice.toString(),
    maxPrice: maxAvailablePrice.toString(),
    sortBy: 'newest'
  });

  const [sliderValues, setSliderValues] = useState({
    min: minAvailablePrice,
    max: maxAvailablePrice
  });

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      minPrice: minAvailablePrice.toString(),
      maxPrice: maxAvailablePrice.toString()
    }));
    setSliderValues({
      min: minAvailablePrice,
      max: maxAvailablePrice
    });
  }, [minAvailablePrice, maxAvailablePrice]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    
    // Оновлюємо повзунок при зміні полів вводу
    if (name === 'minPrice') {
      setSliderValues(prev => ({
        ...prev,
        min: parseFloat(value) || minAvailablePrice
      }));
    } else if (name === 'maxPrice') {
      setSliderValues(prev => ({
        ...prev,
        max: parseFloat(value) || maxAvailablePrice
      }));
    }
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'min' | 'max') => {
    const value = parseFloat(e.target.value);
    const newSliderValues = { ...sliderValues, [type]: value };
    
    // Запобігаємо перетину мінімального та максимального значень
    if (type === 'min' && value > sliderValues.max) {
      newSliderValues.min = sliderValues.max;
    } else if (type === 'max' && value < sliderValues.min) {
      newSliderValues.max = sliderValues.min;
    }
    
    setSliderValues(newSliderValues);
    
    const newFilters = {
      ...filters,
      minPrice: newSliderValues.min.toString(),
      maxPrice: newSliderValues.max.toString()
    };
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

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
            onChange={(e) => handleSliderChange(e, 'min')}
            step="0.01"
            className="slider min-slider"
          />
          <input
            type="range"
            min={minAvailablePrice}
            max={maxAvailablePrice}
            value={sliderValues.max}
            onChange={(e) => handleSliderChange(e, 'max')}
            step="0.01"
            className="slider max-slider"
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
            step="0.01"
          />
          <span>-</span>
          <input
            type="number"
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleInputChange}
            min={minAvailablePrice}
            max={maxAvailablePrice}
            step="0.01"
          />
        </div>
      </div>

      <div className="filter-group">
        <label htmlFor="sortBy">Сортування</label>
        <select
          id="sortBy"
          name="sortBy"
          value={filters.sortBy}
          onChange={handleInputChange}
        >
          <option value="newest">Спочатку нові</option>
          <option value="price-asc">Ціна (за зростанням)</option>
          <option value="price-desc">Ціна (за спаданням)</option>
        </select>
      </div>
    </div>
  );
};