import React, { useState, useCallback, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, Package } from 'lucide-react';
const debounce = <T extends (...args: unknown[]) => void>(fn: T, delay: number) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

interface SearchFilters {
  query: string;
  category: string;
  brand: string;
  priceMin: number | null;
  priceMax: number | null;
  stockMin: number | null;
  stockMax: number | null;
  location: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SearchResult {
  id: number;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  location: string;
  status: string;
  thumbnail?: string;
}

interface Props {
  onSearch: (filters: SearchFilters) => void;
  categories?: string[];
  brands?: string[];
  locations?: string[];
}

const AdvancedSearch: React.FC<Props> = ({ onSearch, categories = [], brands = [], locations = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    brand: '',
    priceMin: null,
    priceMax: null,
    stockMin: null,
    stockMax: null,
    location: '',
    status: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('autotraq_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchFilters: SearchFilters) => {
      onSearch(searchFilters);

      // Save to recent searches
      if (searchFilters.query && searchFilters.query.trim()) {
        const newRecent = [searchFilters.query, ...recentSearches.filter(s => s !== searchFilters.query)].slice(0, 5);
        setRecentSearches(newRecent);
        localStorage.setItem('autotraq_recent_searches', JSON.stringify(newRecent));
      }
    }, 500),
    [onSearch, recentSearches]
  );

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    debouncedSearch(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      query: '',
      category: '',
      brand: '',
      priceMin: null,
      priceMax: null,
      stockMin: null,
      stockMax: null,
      location: '',
      status: '',
      sortBy: 'name',
      sortOrder: 'asc'
    };
    setFilters(clearedFilters);
    onSearch(clearedFilters);
  };

  const hasActiveFilters = () => {
    return filters.category || filters.brand || filters.priceMin || filters.priceMax ||
           filters.stockMin || filters.stockMax || filters.location || filters.status;
  };

  const filterCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.brand) count++;
    if (filters.priceMin || filters.priceMax) count++;
    if (filters.stockMin || filters.stockMax) count++;
    if (filters.location) count++;
    if (filters.status) count++;
    return count;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            placeholder="Search by SKU, part name, or description..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {filters.query && (
            <button
              onClick={() => handleFilterChange('query', '')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
            hasActiveFilters()
              ? 'bg-blue-50 border-blue-500 text-blue-600'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="h-5 w-5" />
          <span>Filters</span>
          {filterCount() > 0 && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
              {filterCount()}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Recent Searches */}
      {!filters.query && recentSearches.length > 0 && (
        <div className="mt-3 flex gap-2 items-center">
          <span className="text-sm text-gray-500">Recent:</span>
          {recentSearches.map((search, index) => (
            <button
              key={index}
              onClick={() => handleFilterChange('query', search)}
              className="text-sm px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-gray-700"
            >
              {search}
            </button>
          ))}
        </div>
      )}

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <select
                value={filters.brand}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Brands</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Locations</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceMin || ''}
                  onChange={(e) => handleFilterChange('priceMin', e.target.value ? Number(e.target.value) : null)}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceMax || ''}
                  onChange={(e) => handleFilterChange('priceMax', e.target.value ? Number(e.target.value) : null)}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Stock Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Level</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.stockMin || ''}
                  onChange={(e) => handleFilterChange('stockMin', e.target.value ? Number(e.target.value) : null)}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.stockMax || ''}
                  onChange={(e) => handleFilterChange('stockMax', e.target.value ? Number(e.target.value) : null)}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
                <option value="backordered">Backordered</option>
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="border-t pt-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name">Name</option>
                <option value="sku">SKU</option>
                <option value="price">Price</option>
                <option value="stock">Stock Level</option>
                <option value="updated">Last Updated</option>
              </select>

              <button
                onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                {filters.sortOrder === 'asc' ? '↑' : '↓'}
                {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </button>
            </div>

            {hasActiveFilters() && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search Shortcuts */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setFilters(prev => ({ ...prev, status: 'low-stock' }));
            onSearch({ ...filters, status: 'low-stock' });
          }}
          className="text-sm px-3 py-1 bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200"
        >
          Low Stock Items
        </button>
        <button
          onClick={() => {
            setFilters(prev => ({ ...prev, sortBy: 'updated', sortOrder: 'desc' }));
            onSearch({ ...filters, sortBy: 'updated', sortOrder: 'desc' });
          }}
          className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
        >
          Recently Updated
        </button>
        <button
          onClick={() => {
            const today = new Date().toISOString().split('T')[0];
            handleFilterChange('query', `added:${today}`);
          }}
          className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200"
        >
          Added Today
        </button>
      </div>
    </div>
  );
};

export default AdvancedSearch;