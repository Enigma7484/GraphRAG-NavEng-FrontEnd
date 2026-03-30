import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";

function MapAutoFit({ routes, selectedRouteIdx }) {
  const map = useMap();

  useEffect(() => {
    const selected = routes?.[selectedRouteIdx];
    if (!selected?.coordinates?.length) return;

    map.fitBounds(selected.coordinates, { padding: [30, 30] });
  }, [routes, selectedRouteIdx, map]);

  return null;
}

export default function MapView({ routes, selectedRouteIdx }) {
  const fallbackCenter = [43.6532, -79.3832];
  const selectedRoute = routes?.[selectedRouteIdx];

  return (
    <MapContainer
      center={fallbackCenter}
      zoom={13}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapAutoFit routes={routes} selectedRouteIdx={selectedRouteIdx} />

      {routes.map((route, idx) => {
        const isSelected = idx === selectedRouteIdx;
        return (
          <Polyline
            key={idx}
            positions={route.coordinates}
            pathOptions={{
              color: isSelected ? "#ef4444" : "#3b82f6",
              weight: isSelected ? 6 : 4,
              opacity: isSelected ? 0.95 : 0.35,
            }}
          />
        );
      })}

      {selectedRoute?.coordinates?.length > 0 && (
        <>
          <Marker position={selectedRoute.coordinates[0]}>
            <Popup>Origin</Popup>
          </Marker>
          <Marker position={selectedRoute.coordinates[selectedRoute.coordinates.length - 1]}>
            <Popup>Destination</Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  );
}