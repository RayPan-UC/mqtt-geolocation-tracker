// Initialize the Leaflet map centered on Calgary
const map = L.map("map").setView([51.0447, -114.0719], 13);

// Add OpenStreetMap tile layer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// Store the current marker so we can update it
let currentMarker = null;

// Get marker color based on temperature value
function getColor(temp) {
  if (temp < 10) return "blue";       // [-40, 10)
  if (temp < 30) return "green";      // [10, 30)
  return "red";                        // [30, 60]
}

// Update the map with a new GeoJSON message
function updateMap(geojson) {
  const coords = geojson.geometry.coordinates;
  const temp = geojson.properties.temperature;

  const lat = coords[1];
  const lng = coords[0];
  const color = getColor(temp);

  // Remove existing marker if present
  if (currentMarker) {
    map.removeLayer(currentMarker);
  }

  // Add a new colored circle marker at the received location
  currentMarker = L.circleMarker([lat, lng], {
    radius: 12,
    color: color,
    fillColor: color,
    fillOpacity: 0.8,
  })
    .addTo(map)
    .bindPopup(`🌡️ Temperature: ${temp.toFixed(1)}°C`)
    .openPopup();

  // Pan the map to the new location
  map.setView([lat, lng], 15);
}

// Get current GPS location, generate GeoJSON, and publish via MQTT
function handleShareStatus() {
  if (!isConnected) {
    alert("Please connect to the broker first.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      // Generate a random temperature between -40 and 60
      const temp = parseFloat((Math.random() * 100 - 40).toFixed(1));

      // Build GeoJSON feature
      const geojson = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
        properties: {
          temperature: temp,
        },
      };

      const topic = "ENGO651/RayPan/my_temperature";
      const payload = JSON.stringify(geojson);

      // Publish the GeoJSON message to the MQTT broker
      const message = new Paho.MQTT.Message(payload);
      message.destinationName = topic;
      client.send(message);

      console.log("Published GeoJSON:", payload);
    },
    (error) => {
      console.error("Geolocation error:", error.message);
      alert("Failed to get location: " + error.message);
    },
    {
      enableHighAccuracy: true,  // Use GPS for best accuracy
      timeout: 10000,
      maximumAge: 0,
    }
  );
}