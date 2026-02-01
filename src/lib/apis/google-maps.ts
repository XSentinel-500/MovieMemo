import axios from 'axios';

const GOOGLE_MAPS_API_URL = 'https://maps.googleapis.com/maps/api';

interface GeocodeResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  place_id: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

interface PlaceSearchResult {
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  place_id: string;
}

class GoogleMapsClient {
  private apiKey: string | null = null;

  private getApiKey(): string {
    if (this.apiKey) {
      return this.apiKey;
    }

    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) {
      throw new Error(
        'Google Maps API key not configured. Get your free API key at https://console.cloud.google.com/apis/credentials'
      );
    }
    this.apiKey = key;
    return this.apiKey;
  }

  async geocodeLocation(address: string): Promise<GeocodeResult | null> {
    try {
      const response = await axios.get(`${GOOGLE_MAPS_API_URL}/geocode/json`, {
        params: {
          address: address,
          key: this.getApiKey(),
        },
      });

      if (response.data.status !== 'OK' || response.data.results.length === 0) {
        return null;
      }

      return response.data.results[0];
    } catch (error: any) {
      console.error(`Google Maps geocoding error: ${error.message}`);
      return null;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
    try {
      const response = await axios.get(`${GOOGLE_MAPS_API_URL}/geocode/json`, {
        params: {
          latlng: `${lat},${lng}`,
          key: this.getApiKey(),
        },
      });

      if (response.data.status !== 'OK' || response.data.results.length === 0) {
        return null;
      }

      return response.data.results[0];
    } catch (error: any) {
      console.error(`Google Maps reverse geocoding error: ${error.message}`);
      return null;
    }
  }

  async searchPlace(query: string): Promise<PlaceSearchResult | null> {
    try {
      const response = await axios.get(`${GOOGLE_MAPS_API_URL}/place/textsearch/json`, {
        params: {
          query: query,
          key: this.getApiKey(),
        },
      });

      if (response.data.status !== 'OK' || response.data.results.length === 0) {
        return null;
      }

      return response.data.results[0];
    } catch (error: any) {
      console.error(`Google Maps place search error: ${error.message}`);
      return null;
    }
  }

  generateMapsLink(lat: number, lng: number, name?: string): string {
    const query = name ? encodeURIComponent(name) : `${lat},${lng}`;
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }

  extractCityCountry(result: GeocodeResult): { city: string; country: string } {
    let city = '';
    let country = '';

    for (const component of result.address_components) {
      if (component.types.includes('locality')) {
        city = component.long_name;
      } else if (component.types.includes('administrative_area_level_1') && !city) {
        city = component.long_name;
      }
      if (component.types.includes('country')) {
        country = component.long_name;
      }
    }

    return { city, country };
  }
}

export const googleMapsClient = new GoogleMapsClient();
export type { GeocodeResult, PlaceSearchResult };
