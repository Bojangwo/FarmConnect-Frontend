import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const ANIMATION_DURATION = 3000;

function MovingAgent({ location }) {
  const map = useMap();

  const [position, setPosition] = useState([
    location.latitude,
    location.longitude,
  ]);

  const positionRef = useRef([location.latitude, location.longitude]);

  const animationRef = useRef(null);

  useEffect(() => {
    const destination = [location.latitude, location.longitude];

    const start = [...positionRef.current];

    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    const distance = map.distance(start, destination);

    // Avoid animating GPS noise or unrealistic jumps.
    if (distance < 2 || distance > 1000) {
      positionRef.current = destination;
      setPosition(destination);
      map.panTo(destination, { animate: false });
      return;
    }

    const startedAt = performance.now();

    function animate(now) {
      const progress = Math.min((now - startedAt) / ANIMATION_DURATION, 1);

      // Smooth acceleration and deceleration.
      const eased =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const nextPosition = [
        start[0] + (destination[0] - start[0]) * eased,
        start[1] + (destination[1] - start[1]) * eased,
      ];

      positionRef.current = nextPosition;
      setPosition(nextPosition);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    }

    animationRef.current = requestAnimationFrame(animate);

    // Gently follow the latest reported location.
    map.panTo(destination, {
      animate: true,
      duration: 1,
    });

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [location.latitude, location.longitude, map]);

  return (
    <>
      <Marker position={position} icon={deliveryIcon}>
        <Popup>
          🚚 Delivery Agent
          <br />
          Latest reported GPS position
        </Popup>
      </Marker>

      {typeof location.accuracy === "number" && (
        <Circle
          center={position}
          radius={location.accuracy}
          pathOptions={{
            color: "#194C35",
            fillColor: "#194C35",
            fillOpacity: 0.1,
          }}
        />
      )}
    </>
  );
}

export default function DeliveryTrackingMap({ location }) {
  if (
    typeof location?.latitude !== "number" ||
    typeof location?.longitude !== "number"
  ) {
    return (
      <p className="text-sm text-gray-600">
        Delivery location is not available yet.
      </p>
    );
  }

  const position = [location.latitude, location.longitude];

  return (
    <div className="overflow-hidden rounded-xl border border-[#DCE5D7]">
      <MapContainer
        center={position}
        zoom={16}
        scrollWheelZoom={false}
        style={{ height: "380px", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MovingAgent location={location} />
      </MapContainer>
    </div>
  );
}
