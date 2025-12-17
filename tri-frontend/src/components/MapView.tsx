import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface Location {
  facility_id?: string;
  facility_name: string;
  state: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  total_release: number;
}

interface MapViewProps {
  locations: Location[];
}

// Component to update map bounds when data changes
function MapBounds({ locations }: { locations: Location[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (locations.length > 0) {
      const validLocations = locations.filter(loc => loc.latitude && loc.longitude);
      if (validLocations.length > 0) {
        const bounds = L.latLngBounds(
          validLocations.map(loc => [loc.latitude!, loc.longitude!])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [locations, map]);
  
  return null;
}

const MapView: React.FC<MapViewProps> = ({ locations }) => {
  // Filter locations that have coordinates
  const validLocations = locations.filter(loc => loc.latitude && loc.longitude);

  // USA center coordinates
  const centerCoords: [number, number] = [39.8283, -98.5795];

  if (validLocations.length === 0) {
    return (
      <div className="map-placeholder">
        <p>📍 No location data available for mapping</p>
        <p className="map-note">
          Facilities need latitude/longitude coordinates to be displayed on the map
        </p>
      </div>
    );
  }

  return (
    <div className="map-container">
      <MapContainer
        center={centerCoords}
        zoom={4}
        style={{ height: '500px', width: '100%', borderRadius: '10px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds locations={validLocations} />
        {validLocations.map((location, index) => (
          <Marker
            key={index}
            position={[location.latitude!, location.longitude!]}
          >
            <Popup>
              <div className="map-popup">
                <h4>{location.facility_name}</h4>
                <p><strong>State:</strong> {location.state}</p>
                {location.city && <p><strong>City:</strong> {location.city}</p>}
                <p><strong>Total Release:</strong> {location.total_release.toLocaleString()} lbs</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;

