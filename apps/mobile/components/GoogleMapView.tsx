import React, { useMemo, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Navigation, Crosshair } from 'lucide-react-native';
import { formatPriceINR } from '@real-estate/shared';

interface Property {
  id: string;
  title: string;
  price: number;
  locality?: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  images?: { url: string }[];
}

interface GoogleMapViewProps {
  properties: Property[];
  userLocation?: { latitude: number; longitude: number } | null;
  onSelectProperty: (propertyId: string) => void;
  onLocateMe?: () => void;
  selectedCity?: string;
}

// Known city centroids for fallback if property coordinates are missing
const CITY_COORDINATES: Record<string, [number, number]> = {
  mumbai: [19.076, 72.8777],
  patna: [25.5941, 85.1376],
  delhi: [28.6139, 77.209],
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  gurgaon: [28.4595, 77.0266],
  gurugram: [28.4595, 77.0266],
  noida: [28.5355, 77.391],
  hyderabad: [17.385, 78.4867],
  pune: [18.5204, 73.8567],
  kolkata: [22.5726, 88.3639],
  chennai: [13.0827, 80.2707],
  india: [22.9734, 78.6569],
};

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  properties,
  userLocation,
  onSelectProperty,
  onLocateMe,
  selectedCity = 'All Cities',
}) => {
  const webViewRef = useRef<any>(null);

  // Prepare map pins with resolved coordinates
  const markers = useMemo(() => {
    return properties.map((prop, idx) => {
      let lat = prop.latitude;
      let lng = prop.longitude;

      if (!lat || !lng) {
        const cityKey = (prop.city || '').toLowerCase().trim();
        const base = CITY_COORDINATES[cityKey] || CITY_COORDINATES['patna'];
        // Offset slightly if multiple properties share fallback city coordinates
        const offsetLat = ((idx * 7) % 20 - 10) * 0.008;
        const offsetLng = ((idx * 11) % 20 - 10) * 0.008;
        lat = base[0] + offsetLat;
        lng = base[1] + offsetLng;
      }

      const imageUrl = prop.images && prop.images.length > 0 ? prop.images[0].url : '';

      return {
        id: prop.id,
        title: prop.title || 'Property',
        locality: prop.locality || prop.city || '',
        priceFormatted: formatPriceINR(prop.price),
        lat,
        lng,
        imageUrl,
      };
    });
  }, [properties]);

  // Center coordinate determination
  const centerCoord = useMemo(() => {
    if (userLocation) {
      return [userLocation.latitude, userLocation.longitude];
    }
    if (markers.length > 0) {
      return [markers[0].lat, markers[0].lng];
    }
    const cityKey = selectedCity.toLowerCase().trim();
    return CITY_COORDINATES[cityKey] || CITY_COORDINATES['india'];
  }, [userLocation, markers, selectedCity]);

  // Generate self-contained Google Maps styled Leaflet HTML
  const mapHtml = useMemo(() => {
    const markersJson = JSON.stringify(markers);
    const userLocJson = JSON.stringify(userLocation || null);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .price-pill-marker {
      background: #2563eb;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 20px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      border: 2px solid #ffffff;
      white-space: nowrap;
      text-align: center;
      cursor: pointer;
      display: inline-block;
    }
    .price-pill-marker:hover {
      background: #1d4ed8;
      transform: scale(1.05);
    }
    .user-gps-marker {
      width: 16px;
      height: 16px;
      background: #0ea5e9;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 0 12px #0ea5e9;
      position: relative;
    }
    .user-gps-pulse {
      position: absolute;
      width: 32px;
      height: 32px;
      left: -11px;
      top: -11px;
      border-radius: 50%;
      background: rgba(14, 165, 233, 0.35);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    .leaflet-popup-content-wrapper {
      border-radius: 14px;
      padding: 0;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.25);
    }
    .leaflet-popup-content {
      margin: 0;
      line-height: 1.4;
      width: 210px !important;
    }
    .popup-thumb {
      width: 100%;
      height: 110px;
      object-fit: cover;
      display: block;
      background: #e2e8f0;
    }
    .popup-body {
      padding: 10px 12px;
    }
    .popup-price {
      color: #2563eb;
      font-size: 15px;
      font-weight: 800;
      margin-bottom: 2px;
    }
    .popup-title {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 2px;
    }
    .popup-loc {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 8px;
    }
    .popup-btn {
      display: block;
      width: 100%;
      background: #2563eb;
      color: #ffffff;
      text-align: center;
      padding: 6px 0;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([${centerCoord[0]}, ${centerCoord[1]}], ${userLocation ? 14 : selectedCity === 'All Cities' ? 5 : 12});

    // Google Maps Styled OpenStreetMap Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    var markersData = ${markersJson};
    var userLoc = ${userLocJson};

    // Add User GPS marker
    if (userLoc && userLoc.latitude && userLoc.longitude) {
      var gpsIcon = L.divIcon({
        className: 'gps-marker-container',
        html: '<div class="user-gps-pulse"></div><div class="user-gps-marker"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      L.marker([userLoc.latitude, userLoc.longitude], { icon: gpsIcon })
        .addTo(map)
        .bindPopup('<b>You are here</b><br/>Current GPS Location');
    }

    // Add property pins
    var allBounds = [];
    if (userLoc && userLoc.latitude) {
      allBounds.push([userLoc.latitude, userLoc.longitude]);
    }

    markersData.forEach(function(item) {
      var customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: '<div class="price-pill-marker">' + item.priceFormatted + '</div>',
        iconSize: [80, 26],
        iconAnchor: [40, 13]
      });

      var marker = L.marker([item.lat, item.lng], { icon: customIcon }).addTo(map);
      allBounds.push([item.lat, item.lng]);

      var popupHtml = '<div class="popup-wrap">';
      if (item.imageUrl) {
        popupHtml += '<img class="popup-thumb" src="' + item.imageUrl + '" onerror="this.style.display=\\'none\\'" />';
      }
      popupHtml += '<div class="popup-body">';
      popupHtml += '<div class="popup-price">' + item.priceFormatted + '</div>';
      popupHtml += '<div class="popup-title">' + item.title + '</div>';
      popupHtml += '<div class="popup-loc">📍 ' + item.locality + '</div>';
      popupHtml += '<a href="javascript:void(0)" class="popup-btn" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({ type: \\'SELECT_PROPERTY\\', id: \\'' + item.id + '\\' }))">View Details &rarr;</a>';
      popupHtml += '</div></div>';

      marker.bindPopup(popupHtml);
    });

    if (allBounds.length > 1 && !userLoc) {
      try {
        map.fitBounds(allBounds, { padding: [40, 40], maxZoom: 14 });
      } catch(e){}
    }
  </script>
</body>
</html>
    `;
  }, [markers, userLocation, centerCoord, selectedCity]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_PROPERTY' && data.id) {
        onSelectProperty(data.id);
      }
    } catch (err) {
      console.warn('Map message parse error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.webView}
        onMessage={handleMessage}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Opening Google Map & Locating Properties...</Text>
          </View>
        )}
      />

      {/* GPS Location Quick Center FAB */}
      {onLocateMe && (
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.locateBtn}
          onPress={onLocateMe}
        >
          <Crosshair size={20} color="#2563eb" />
          <Text style={styles.locateBtnText}>My Location</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  webView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  locateBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  locateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
});
