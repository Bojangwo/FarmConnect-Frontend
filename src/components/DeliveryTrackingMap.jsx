import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default marker icons in Vite
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const deliveryIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function RecenterMap({ position }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [map, position[0], position[1]]);

  return null;
}

export default function DeliveryTrackingMap({ location }) {
  if (
    typeof location?.latitude !== "number" ||
    typeof location?.longitude !== "number"
  ) {
    return <p>Delivery location is not available yet.</p>;
  }

  const position = [location.latitude, location.longitude];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "350px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={position} icon={deliveryIcon}>
          <Popup>
            🚚 Delivery Agent's Last Known Location
          </Popup>
        </Marker>

        {typeof location.accuracy === "number" && (
          <Circle
            center={position}
            radius={location.accuracy}
            pathOptions={{
              color: "green",
              fillColor: "green",
              fillOpacity: 0.1,
            }}
          />
        )}

        <RecenterMap position={position} />
      </MapContainer>
    </div>
  );
}
