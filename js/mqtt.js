// MQTT client instance
let client = null;
let isConnected = false;

// Handle connect / disconnect button click
function handleConnect() {
  if (isConnected) {
    disconnect();
  } else {
    connect();
  }
}

// Establish connection to the MQTT broker
function connect() {
  const host = document.getElementById("host").value;
  const port = parseInt(document.getElementById("port").value);

  // Generate a unique client ID to avoid conflicts
  const clientId = "mqttjs_" + Math.random().toString(16).substr(2, 8);

  client = new Paho.MQTT.Client(host, port, clientId);

  // Callback: triggered when a message is received
  client.onMessageArrived = onMessageArrived;

  // Callback: triggered when connection is lost
  client.onConnectionLost = onConnectionLost;

  // Connect to the broker
  client.connect({
    onSuccess: onConnect,
    onFailure: onFailure,
    useSSL: true,
  });
}

// Called when connection is successfully established
function onConnect() {
  isConnected = true;

  // Update UI
  setStatus("connected", "● Connected");
  document.getElementById("connectBtn").textContent = "■ End";
  document.getElementById("host").disabled = true;
  document.getElementById("port").disabled = true;
  document.getElementById("topic").disabled = true;

  // Subscribe to the temperature topic
  const topic = "ENGO651/RayPan/my_temperature";
  client.subscribe(topic);
  console.log("Subscribed to:", topic);
}

// Called when connection attempt fails
function onFailure(err) {
  console.error("Connection failed:", err.errorMessage);
  setStatus("disconnected", "● Connection Failed");
}

// Called when connection is lost unexpectedly
function onConnectionLost(response) {
  isConnected = false;
  setStatus("disconnected", "● Disconnected");
  document.getElementById("connectBtn").textContent = "▶ Start";
  document.getElementById("host").disabled = false;
  document.getElementById("port").disabled = false;

  if (response.errorCode !== 0) {
    console.warn("Connection lost:", response.errorMessage);
    // Auto reconnect after 3 seconds
    setTimeout(() => {
      setStatus("disconnected", "● Reconnecting...");
      connect();
    }, 3000);
  }
}

// Called when a message arrives on the subscribed topic
function onMessageArrived(message) {
  console.log("Message received:", message.payloadString);
  try {
    const geojson = JSON.parse(message.payloadString);
    updateMap(geojson);
  } catch (e) {
    console.error("Invalid GeoJSON:", e);
  }
}

// Publish a custom message to the specified topic
function handlePublish() {
  if (!isConnected) {
    alert("Please connect to the broker first.");
    return;
  }

  const topic = document.getElementById("topic").value;
  const payload = document.getElementById("message").value;

  if (!topic || !payload) {
    alert("Please enter a topic and message.");
    return;
  }

  const message = new Paho.MQTT.Message(payload);
  message.destinationName = topic;
  client.send(message);
  console.log("Published to", topic, ":", payload);

  // Clear message box
  document.getElementById("message").value = ""
}

// Disconnect from the broker
function disconnect() {
  if (client && isConnected) {
    client.disconnect();
  }
  isConnected = false;
  setStatus("disconnected", "● Disconnected");
  document.getElementById("connectBtn").textContent = "▶ Start";
  document.getElementById("host").disabled = false;
  document.getElementById("port").disabled = false;
}

// Update the status indicator
function setStatus(type, text) {
  const statusEl = document.getElementById("status");
  statusEl.textContent = text;
  statusEl.className = type;
}