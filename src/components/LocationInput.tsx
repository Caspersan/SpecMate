import { useState, useEffect, useRef } from 'react'
import type { ProjectLocation } from '../types'
import { geocodeAddress, reverseGeocode, looksLikeAddress, searchAddressSuggestions, type AddressSuggestion } from '../utils/geocode'

interface LocationInputProps {
  onLocationChange: (location: ProjectLocation | null) => void
}

export default function LocationInput({ onLocationChange }: LocationInputProps) {
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<ProjectLocation | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [debouncedAddress, setDebouncedAddress] = useState('')
  const geocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suggestionContainerRef = useRef<HTMLDivElement>(null)

  const parseDMSCoordinates = (input: string): { lat: number; lng: number } | null => {
    // Pattern to match DMS format: 25°43'01.7"N 80°11'42.7"W
    // Matches: degrees°minutes'seconds"direction
    const dmsPattern = /(\d+)°(\d+)'([\d.]+)"([NS])[\s,]+(\d+)°(\d+)'([\d.]+)"([EW])/i
    
    const match = input.match(dmsPattern)
    if (!match) {
      return null
    }

    // Extract latitude components
    const latDegrees = parseFloat(match[1])
    const latMinutes = parseFloat(match[2])
    const latSeconds = parseFloat(match[3])
    const latDirection = match[4].toUpperCase()

    // Extract longitude components
    const lngDegrees = parseFloat(match[5])
    const lngMinutes = parseFloat(match[6])
    const lngSeconds = parseFloat(match[7])
    const lngDirection = match[8].toUpperCase()

    // Convert DMS to decimal degrees
    let lat = latDegrees + (latMinutes / 60) + (latSeconds / 3600)
    let lng = lngDegrees + (lngMinutes / 60) + (lngSeconds / 3600)

    // Apply direction (South and West are negative)
    if (latDirection === 'S') lat = -lat
    if (lngDirection === 'W') lng = -lng

    // Validate coordinate ranges
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng }
    }

    return null
  }

  const parseCoordinates = (input: string): { lat: number; lng: number } | null => {
    // First try DMS format (e.g., 25°43'01.7"N 80°11'42.7"W)
    const dmsResult = parseDMSCoordinates(input)
    if (dmsResult) {
      return dmsResult
    }

    // Fall back to decimal degree format
    // Remove common labels and whitespace
    const cleaned = input
      .toLowerCase()
      .replace(/lat(itude)?:?/g, '')
      .replace(/lon(g|gitude)?:?/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    // Try to extract two numbers
    const numbers = cleaned.match(/-?\d+\.?\d*/g)
    if (numbers && numbers.length >= 2) {
      const lat = parseFloat(numbers[0])
      const lng = parseFloat(numbers[1])

      // Validate coordinate ranges
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng }
      }
    }

    return null
  }

  // Fallback jurisdiction detection for coordinates (when geocoding not available)
  const detectJurisdiction = (lat: number, lng: number): { jurisdiction: string; buildingCode: string } => {
    // US Major Cities (simplified examples)
    const jurisdictions: Array<{
      name: string
      bounds: { latMin: number; latMax: number; lngMin: number; lngMax: number }
      code: string
    }> = [
      {
        name: 'New York City, NY, USA',
        bounds: { latMin: 40.4, latMax: 41.0, lngMin: -74.3, lngMax: -73.7 },
        code: 'IBC 2021 with NYC Building Code amendments'
      },
      {
        name: 'Los Angeles, CA, USA',
        bounds: { latMin: 33.7, latMax: 34.3, lngMin: -118.7, lngMax: -118.1 },
        code: 'IBC 2021 with California Building Code (CBC)'
      },
      {
        name: 'Chicago, IL, USA',
        bounds: { latMin: 41.6, latMax: 42.0, lngMin: -87.9, lngMax: -87.5 },
        code: 'IBC 2021 with Chicago Building Code amendments'
      },
      {
        name: 'San Francisco, CA, USA',
        bounds: { latMin: 37.6, latMax: 37.9, lngMin: -122.6, lngMax: -122.3 },
        code: 'IBC 2021 with California Building Code (CBC) and SF amendments'
      },
      {
        name: 'Seattle, WA, USA',
        bounds: { latMin: 47.4, latMax: 47.8, lngMin: -122.5, lngMax: -122.2 },
        code: 'IBC 2021 with Washington State Building Code'
      },
      {
        name: 'Miami, FL, USA',
        bounds: { latMin: 25.6, latMax: 26.0, lngMin: -80.4, lngMax: -80.0 },
        code: 'IBC 2021 with Florida Building Code (High Velocity Hurricane Zone)'
      },
    ]

    // Check if coordinates fall within known jurisdictions
    for (const jur of jurisdictions) {
      if (
        lat >= jur.bounds.latMin &&
        lat <= jur.bounds.latMax &&
        lng >= jur.bounds.lngMin &&
        lng <= jur.bounds.lngMax
      ) {
        return { jurisdiction: jur.name, buildingCode: jur.code }
      }
    }

    // General US coordinates
    if (lat >= 24 && lat <= 50 && lng >= -125 && lng <= -65) {
      return {
        jurisdiction: 'United States (General)',
        buildingCode: 'IBC 2021 (International Building Code)'
      }
    }

    // International fallback
    return {
      jurisdiction: 'International',
      buildingCode: 'Refer to local building codes and standards'
    }
  }

  // Handle coordinate input (immediate)
  const handleCoordinateInput = (coords: { lat: number; lng: number }, inputValue: string) => {
    // Try reverse geocoding for better jurisdiction info
    reverseGeocode(coords.lat, coords.lng)
      .then((geocodeResult) => {
        const newLocation: ProjectLocation = {
          input: inputValue,
          coordinates: coords,
          jurisdiction: geocodeResult.jurisdiction,
          buildingCode: geocodeResult.buildingCode,
        }
        setLocation(newLocation)
        onLocationChange(newLocation)
        setError(null)
        setIsGeocoding(false)
      })
      .catch(() => {
        // Fallback to coordinate-based detection if reverse geocoding fails
        const { jurisdiction, buildingCode } = detectJurisdiction(coords.lat, coords.lng)
        const newLocation: ProjectLocation = {
          input: inputValue,
          coordinates: coords,
          jurisdiction,
          buildingCode,
        }
        setLocation(newLocation)
        onLocationChange(newLocation)
        setError(null)
        setIsGeocoding(false)
      })
  }

  // Handle address input (with debouncing)
  const handleAddressInput = async (address: string) => {
    setIsGeocoding(true)
    setError(null)

    try {
      const geocodeResult = await geocodeAddress(address)
      const newLocation: ProjectLocation = {
        input: address,
        coordinates: geocodeResult.coordinates,
        jurisdiction: geocodeResult.jurisdiction,
        buildingCode: geocodeResult.buildingCode,
      }
      setLocation(newLocation)
      onLocationChange(newLocation)
      setError(null)
    } catch (err) {
      setLocation(null)
      onLocationChange(null)
      setError(err instanceof Error ? err.message : 'Failed to geocode address. Please try again or use coordinates.')
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleInputChange = (value: string) => {
    setInput(value)
    setError(null)

    // Clear any pending timeouts
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current)
      geocodeTimeoutRef.current = null
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }

    if (!value.trim()) {
      setLocation(null)
      onLocationChange(null)
      setIsGeocoding(false)
      setSuggestions([])
      setShowSuggestions(false)
      setDebouncedAddress('')
      return
    }

    // First, try to parse as coordinates
    const coords = parseCoordinates(value)
    if (coords) {
      setIsGeocoding(true)
      setSuggestions([])
      setShowSuggestions(false)
      handleCoordinateInput(coords, value)
      return
    }

    // If not coordinates, check if it looks like an address
    if (looksLikeAddress(value) || value.length >= 5) {
      // Debounce address search with 500ms delay
      debounceTimeoutRef.current = setTimeout(() => {
        setDebouncedAddress(value)
      }, 500)
      return
    }

    // Clear suggestions for short input
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleClearInput = () => {
    setInput('')
    setLocation(null)
    onLocationChange(null)
    setSuggestions([])
    setShowSuggestions(false)
    setError(null)
    setDebouncedAddress('')
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current)
      geocodeTimeoutRef.current = null
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }
  }

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    const newLocation: ProjectLocation = {
      input: suggestion.displayName,
      coordinates: suggestion.fullResult.coordinates,
      jurisdiction: suggestion.fullResult.jurisdiction || '',
      buildingCode: suggestion.fullResult.buildingCode || '',
    }
    
    setInput(suggestion.displayName)
    setLocation(newLocation)
    onLocationChange(newLocation)
    setSuggestions([])
    setShowSuggestions(false)
    setError(null)
  }

  // Effect to fetch suggestions when debouncedAddress changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedAddress || debouncedAddress.length < 5) {
        setSuggestions([])
        setShowSuggestions(false)
        setIsSearching(false)
        return
      }

      // Don't search for coordinates
      const coords = parseCoordinates(debouncedAddress)
      if (coords) {
        return
      }

      setIsSearching(true)
      setShowSuggestions(true)

      try {
        const results = await searchAddressSuggestions(debouncedAddress)
        setSuggestions(results)
      } catch (error) {
        console.error('Failed to fetch address suggestions:', error)
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }

    fetchSuggestions()
  }, [debouncedAddress])

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionContainerRef.current && !suggestionContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current)
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        📍 Project Location (Optional)
      </h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="location-input" className="block text-sm font-medium text-gray-700 mb-2">
            Enter address or coordinates for code compliance analysis
          </label>
          <div className="relative" ref={suggestionContainerRef}>
            <input
              id="location-input"
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={`123 Main St, New York, NY or 40.7128, -74.0060`}
              className="w-full px-4 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={isGeocoding}
            />
            
            {/* Clear button */}
            {input && (
              <button
                onClick={handleClearInput}
                className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear input"
                type="button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            
            {/* Loading indicator */}
            {(isGeocoding || isSearching) && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-b-lg shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer"
                  >
                    <div className="text-sm text-gray-900">{suggestion.displayName}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Helper text based on input length */}
          {input && input.length > 0 && input.length < 5 && !parseCoordinates(input) && (
            <p className="text-xs text-gray-500 mt-1">
              Type at least 5 characters to see suggestions
            </p>
          )}
          
          {/* Searching indicator */}
          {isSearching && (
            <p className="text-xs text-blue-600 mt-1">
              Searching...
            </p>
          )}

          {/* Default helper text */}
          {(!input || input.length === 0) && (
            <p className="text-xs text-gray-500 mt-1">
              Enter an address or coordinates (lat, lng or DMS format) to get building code compliance notes for materials
            </p>
          )}
          
          {/* Show regular helper for coords or valid long input */}
          {input && input.length >= 5 && !isSearching && !showSuggestions && (
            <p className="text-xs text-gray-500 mt-1">
              Enter an address or coordinates (lat, lng or DMS format) to get building code compliance notes for materials
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {location && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Location Detected
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Jurisdiction:</strong> {location.jurisdiction}
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Building Code:</strong> {location.buildingCode}
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Code compliance notes will be included in material analysis
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

