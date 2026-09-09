import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';
import { showToast } from './toast';

export interface UserGpsLocation {
  latitude: number;
  longitude: number;
  city?: string;
  locality?: string;
  region?: string;
}

/**
 * Prompts user for GPS location permission and fetches high-accuracy coordinates
 */
export async function requestAndFetchUserLocation(): Promise<UserGpsLocation | null> {
  try {
    // Check existing permission
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Location.requestForegroundPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      showToast('GPS Permission Denied. Please enable location in device settings.', 'error');
      return null;
    }

    showToast('Fetching your GPS location...', 'info');

    // Fetch current GPS position
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = position.coords;

    // Reverse geocode to get city and locality name
    let city: string | undefined;
    let locality: string | undefined;
    let region: string | undefined;

    try {
      const geocodeResults = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (geocodeResults && geocodeResults.length > 0) {
        const place = geocodeResults[0];
        city = place.city || place.subregion || place.region || undefined;
        locality = place.district || place.name || place.street || undefined;
        region = place.region || undefined;
      }
    } catch (geoErr) {
      console.warn('Reverse geocode note:', geoErr);
    }

    return {
      latitude,
      longitude,
      city,
      locality,
      region,
    };
  } catch (err: any) {
    console.error('Error fetching GPS location:', err);
    showToast(err.message || 'Could not fetch GPS location', 'error');
    return null;
  }
}
