/**
 * Geocoding utility using OpenStreetMap Nominatim API
 * Free, no API key required, but has rate limits (1 req/sec)
 * 
 * Can be easily swapped for Google Maps or Mapbox by changing the API endpoint
 */

export interface GeocodeResult {
  coordinates: {
    lat: number;
    lng: number;
  };
  address: {
    formatted: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  jurisdiction?: string;
  buildingCode?: string;
}

export interface GeocodeError {
  message: string;
  code?: string;
}

/**
 * Address suggestion for autocomplete
 */
export interface AddressSuggestion {
  displayName: string;
  fullResult: GeocodeResult;
}

/**
 * Search for address suggestions (for autocomplete)
 * Returns multiple results without the 1-second delay
 */
export async function searchAddressSuggestions(address: string): Promise<AddressSuggestion[]> {
  try {
    // Encode address for URL
    const encodedAddress = encodeURIComponent(address);
    
    // Nominatim API endpoint - get up to 5 suggestions
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=5&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SpecMate/1.0 (Architectural Material Analysis Tool)',
      },
    });

    if (!response.ok) {
      // Silently fail for suggestions (as per requirements)
      console.error('Address suggestion API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return [];
    }

    // Map results to suggestions
    const suggestions: AddressSuggestion[] = data.map((result: any) => {
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      const addressParts = result.address || {};
      const formattedAddress = result.display_name || address;
      
      // Build jurisdiction string
      const jurisdictionParts: string[] = [];
      if (addressParts.city || addressParts.town || addressParts.village) {
        jurisdictionParts.push(addressParts.city || addressParts.town || addressParts.village);
      }
      if (addressParts.state) {
        jurisdictionParts.push(addressParts.state);
      }
      if (addressParts.country) {
        jurisdictionParts.push(addressParts.country);
      }
      const jurisdiction = jurisdictionParts.length > 0 
        ? jurisdictionParts.join(', ') 
        : formattedAddress;

      // Determine building code
      const buildingCode = determineBuildingCode(
        lat,
        lng,
        addressParts.state,
        addressParts.city || addressParts.town || addressParts.village,
        addressParts.country
      );

      return {
        displayName: formattedAddress,
        fullResult: {
          coordinates: { lat, lng },
          address: {
            formatted: formattedAddress,
            city: addressParts.city || addressParts.town || addressParts.village,
            state: addressParts.state,
            country: addressParts.country,
            postalCode: addressParts.postcode,
          },
          jurisdiction,
          buildingCode,
        }
      };
    });

    return suggestions;
  } catch (error) {
    // Silently fail for suggestions (as per requirements)
    console.error('Failed to fetch address suggestions:', error);
    return [];
  }
}

/**
 * Geocode an address to coordinates and extract jurisdiction information
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  // Rate limiting: Nominatim requires max 1 request per second
  // In production, you'd want a more sophisticated rate limiter
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  await delay(1000);

  try {
    // Encode address for URL
    const encodedAddress = encodeURIComponent(address);
    
    // Nominatim API endpoint
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SpecMate/1.0 (Architectural Material Analysis Tool)', // Required by Nominatim
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Geocoding service rate limit exceeded. Please wait a moment and try again, or use coordinates instead.');
      }
      if (response.status >= 500) {
        throw new Error('Geocoding service is temporarily unavailable. Please try again later or use coordinates.');
      }
      throw new Error(`Geocoding service error (${response.status}). Please try a different address or use coordinates.`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error('Address not found. Please try a more specific address or use coordinates.');
    }

    const result = data[0];
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Invalid coordinates returned from geocoding service');
    }

    // Extract address components
    const addressParts = result.address || {};
    const formattedAddress = result.display_name || address;
    
    // Build jurisdiction string
    const jurisdictionParts: string[] = [];
    if (addressParts.city || addressParts.town || addressParts.village) {
      jurisdictionParts.push(addressParts.city || addressParts.town || addressParts.village);
    }
    if (addressParts.state) {
      jurisdictionParts.push(addressParts.state);
    }
    if (addressParts.country) {
      jurisdictionParts.push(addressParts.country);
    }
    const jurisdiction = jurisdictionParts.length > 0 
      ? jurisdictionParts.join(', ') 
      : formattedAddress;

    // Determine building code based on location
    const buildingCode = determineBuildingCode(
      lat,
      lng,
      addressParts.state,
      addressParts.city || addressParts.town || addressParts.village,
      addressParts.country
    );

    return {
      coordinates: { lat, lng },
      address: {
        formatted: formattedAddress,
        city: addressParts.city || addressParts.town || addressParts.village,
        state: addressParts.state,
        country: addressParts.country,
        postalCode: addressParts.postcode,
      },
      jurisdiction,
      buildingCode,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to geocode address. Please try again or use coordinates.');
  }
}

/**
 * Reverse geocode: Convert coordinates to address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  // Rate limiting
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  await delay(1000);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SpecMate/1.0 (Architectural Material Analysis Tool)',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Geocoding service rate limit exceeded. Using coordinate-based location detection.');
      }
      if (response.status >= 500) {
        throw new Error('Geocoding service is temporarily unavailable. Using coordinate-based location detection.');
      }
      throw new Error(`Reverse geocoding service error (${response.status}). Using coordinate-based location detection.`);
    }

    const result = await response.json();

    if (!result || !result.address) {
      throw new Error('Location not found');
    }

    const addressParts = result.address;
    const formattedAddress = result.display_name || `${lat}, ${lng}`;
    
    // Build jurisdiction string
    const jurisdictionParts: string[] = [];
    if (addressParts.city || addressParts.town || addressParts.village) {
      jurisdictionParts.push(addressParts.city || addressParts.town || addressParts.village);
    }
    if (addressParts.state) {
      jurisdictionParts.push(addressParts.state);
    }
    if (addressParts.country) {
      jurisdictionParts.push(addressParts.country);
    }
    const jurisdiction = jurisdictionParts.length > 0 
      ? jurisdictionParts.join(', ') 
      : formattedAddress;

    // Determine building code
    const buildingCode = determineBuildingCode(
      lat,
      lng,
      addressParts.state,
      addressParts.city || addressParts.town || addressParts.village,
      addressParts.country
    );

    return {
      coordinates: { lat, lng },
      address: {
        formatted: formattedAddress,
        city: addressParts.city || addressParts.town || addressParts.village,
        state: addressParts.state,
        country: addressParts.country,
        postalCode: addressParts.postcode,
      },
      jurisdiction,
      buildingCode,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to reverse geocode coordinates');
  }
}

/**
 * Determine building code based on location
 * Enhanced version that uses geocoding data when available
 */
function determineBuildingCode(
  lat: number,
  lng: number,
  state?: string,
  city?: string,
  country?: string
): string {
  // US-specific codes
  if (country === 'United States' || country === 'USA' || country === 'US') {
    // Major cities with specific codes
    if (city) {
      const cityLower = city.toLowerCase();
      
      if (cityLower.includes('new york') || cityLower === 'nyc') {
        return 'IBC 2021 with NYC Building Code amendments';
      }
      if (cityLower.includes('los angeles') || cityLower === 'la') {
        return 'IBC 2021 with California Building Code (CBC)';
      }
      if (cityLower.includes('chicago')) {
        return 'IBC 2021 with Chicago Building Code amendments';
      }
      if (cityLower.includes('san francisco') || cityLower === 'sf') {
        return 'IBC 2021 with California Building Code (CBC) and SF amendments';
      }
      if (cityLower.includes('seattle')) {
        return 'IBC 2021 with Washington State Building Code';
      }
      if (cityLower.includes('miami')) {
        return 'IBC 2021 with Florida Building Code (High Velocity Hurricane Zone)';
      }
    }

    // State-specific codes
    if (state) {
      const stateLower = state.toLowerCase();
      
      if (stateLower === 'california' || stateLower === 'ca') {
        return 'IBC 2021 with California Building Code (CBC)';
      }
      if (stateLower === 'florida' || stateLower === 'fl') {
        // Check if in high velocity hurricane zone (southern FL)
        if (lat >= 25.0 && lat <= 26.0) {
          return 'IBC 2021 with Florida Building Code (High Velocity Hurricane Zone)';
        }
        return 'IBC 2021 with Florida Building Code';
      }
      if (stateLower === 'new york' || stateLower === 'ny') {
        return 'IBC 2021 with New York State Building Code';
      }
      if (stateLower === 'washington' || stateLower === 'wa') {
        return 'IBC 2021 with Washington State Building Code';
      }
      if (stateLower === 'illinois' || stateLower === 'il') {
        return 'IBC 2021 with Illinois Building Code';
      }
    }

    // General US
    if (lat >= 24 && lat <= 50 && lng >= -125 && lng <= -65) {
      return 'IBC 2021 (International Building Code)';
    }
  }

  // Canada
  if (country === 'Canada' || country === 'CA') {
    return 'National Building Code of Canada (NBC)';
  }

  // International fallback
  return 'Refer to local building codes and standards';
}

/**
 * Check if input looks like an address (not coordinates)
 */
export function looksLikeAddress(input: string): boolean {
  const trimmed = input.trim();
  
  // If it contains coordinate patterns, it's not an address
  if (/\d+°\d+'[\d.]+"[NS]/i.test(trimmed)) return false; // DMS format
  if (/^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/.test(trimmed)) return false; // Decimal coords
  
  // If it contains letters and common address words, it's likely an address
  if (/[a-zA-Z]/.test(trimmed) && (
    /\b(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|place|pl|court|ct|circle|cir)\b/i.test(trimmed) ||
    /\b(city|state|zip|postal|code)\b/i.test(trimmed) ||
    /\b\d+\s+[a-zA-Z]/.test(trimmed) // Number followed by letter (e.g., "123 Main")
  )) {
    return true;
  }
  
  // If it's mostly text (not just numbers), treat as address
  const hasLetters = /[a-zA-Z]/.test(trimmed);
  if (hasLetters && trimmed.length > 10) {
    return true;
  }
  
  return false;
}

