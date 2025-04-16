let map;
let markers = [];
let userMarker = null;

// Initialize the map
function initMap() {
    // Create map centered on a default location
    map = L.map('map').setView([43.7, -79.4], 12); // Default to Toronto area
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    document.getElementById('locate-me').addEventListener('click', locateUser);
    document.getElementById('explore-btn').addEventListener('click', exploreTrails);
    document.getElementById('search-input').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            searchParks();
        }
    });
    document.getElementById('filter-toggle').addEventListener('click', function() {
        const filterButtons = document.querySelector('.filter-buttons');
        filterButtons.style.display = filterButtons.style.display === 'none' ? 'flex' : 'none';
    });
    initFilters();
    // Initially locate the user
    locateUser();
}

// Function to locate the user and find nearby parks
function locateUser() {
    showLoading(true);
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = [position.coords.latitude, position.coords.longitude];
                map.setView(userLocation, 14); // Center map on user's location
                
                // Remove previous user marker if it exists
                if (userMarker) {
                    userMarker.remove();
                }
                
                // Add a marker for the user's location
                userMarker = L.marker(userLocation).addTo(map)
                    .bindPopup('You are here!')
                    .openPopup();
                
                // Fetch parks near the user's location
                fetchParks(userLocation[0], userLocation[1]);
            },
            (error) => {
                alert("Error getting your location: " + error.message);
                showLoading(false);
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
        showLoading(false);
    }
}

// Function to explore trails (placeholder)
function exploreTrails() {
    window.location.href = "selection.html";
}

// Function to search for parks in a specific location
function searchParks() {
    const query = document.getElementById('search-input').value;
    if (!query) {
        alert("Please enter a location.");
        return;
    }
    
    showLoading(true);
    
    // Clear existing markers
    clearMarkers();
    
    // Use Nominatim API to geocode the search query
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                alert("Location not found. Please try again.");
                showLoading(false);
                return;
            }
            
            const location = data[0]; // Use the first result
            const lat = parseFloat(location.lat);
            const lon = parseFloat(location.lon);
            
            // Center the map on the searched location
            map.setView([lat, lon], 14);
            
            // Fetch parks near the searched location
            fetchParks(lat, lon);
        })
        .catch(error => {
            console.error('Error fetching location:', error);
            alert("Failed to fetch location. Please try again.");
            showLoading(false);
        });
}

function processParkData(data, userLat, userLon) {
clearMarkers(); 
if (data.elements.length === 0) {
alert("No parks or trails found nearby. Try searching a different area.");
showLoading(false);
return;
}

// Process the returned data
const processedPlaces = [];
const placeIds = new Set(); // Track place IDs to avoid duplicates

data.elements.forEach(element => {
if (!element.tags) return;

let lat, lon, name;
if (element.type === 'node') {
    lat = element.lat;
    lon = element.lon;
} else if (element.type === 'way' || element.type === 'relation') {
    if (!element.center) return; 
    lat = element.center.lat;
    lon = element.center.lon;
} else {
    return; 
}

// Use name or determine a place type name
name = element.tags.name;
if (!name) {
    if (element.tags.leisure === 'park') name = 'Unnamed Park';
    else if (element.tags.leisure === 'playground') name = 'Playground';
    else if (element.tags.tourism === 'camp_site') name = 'Campsite';
    else if (element.tags.highway === 'path') name = 'Trail';
    else name = 'Outdoor Area';
}

// Create a unique identifier
const placeId = `${element.type}-${element.id}`;

// Initialize or get existing place
let place;
if (placeIds.has(placeId)) {
    place = processedPlaces.find(p => p.id === placeId);
} else {
    place = {
        id: placeId,
        lat,
        lon,
        name,
        amenities: [],
        filters: {
            'Easy': false,
            'Kid Friendly': false,
            'Camping': false,
            'Dog Friendly': false
        },
        tags: element.tags,
        distance: calculateDistance(lat, lon, userLat, userLon)
    };
    placeIds.add(placeId);
    processedPlaces.push(place);
}

// Check for filter criteria
if (element.tags.highway === 'path' && 
    (element.tags.sac_scale === 'hiking' || element.tags.trail_visibility === 'excellent')) {
    place.filters['Easy'] = true;
    if (!place.amenities.includes('Easy Trail')) place.amenities.push('Easy Trail');
}

if (element.tags.playground === 'yes' || element.tags.leisure === 'playground') {
    place.filters['Kid Friendly'] = true;
    if (!place.amenities.includes('Playground')) place.amenities.push('Playground');
}

if (element.tags.tourism === 'camp_site' || element.tags.caravans === 'yes' || element.tags.tents === 'yes') {
    place.filters['Camping'] = true;
    if (!place.amenities.includes('Camping')) place.amenities.push('Camping');
}

if (element.tags.dog === 'yes' || element.tags.dogs === 'yes' || element.tags.dog_park === 'yes') {
    place.filters['Dog Friendly'] = true;
    if (!place.amenities.includes('Dog Friendly')) place.amenities.push('Dog Friendly');
}

// Additional amenities
if (element.tags.toilets === 'yes' || element.tags.amenity === 'toilets') {
    if (!place.amenities.includes('Restrooms')) place.amenities.push('Restrooms');
}

if (element.tags.picnic_table === 'yes' || element.tags.leisure === 'picnic_site') {
    if (!place.amenities.includes('Picnic Area')) place.amenities.push('Picnic Area');
}
});

// Sort places by distance and add markers
processedPlaces.sort((a, b) => a.distance - b.distance);

// Store the processed data globally for filtering
window.allPlaces = processedPlaces;

// Add markers to map based on current filters
applyFilters();

showLoading(false);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
const R = 6371; // Radius of the earth in km
const dLat = deg2rad(lat2 - lat1);
const dLon = deg2rad(lon2 - lon1);
const a = 
Math.sin(dLat/2) * Math.sin(dLat/2) +
Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
Math.sin(dLon/2) * Math.sin(dLon/2); 
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
const d = R * c; // Distance in km
return d;
}

function deg2rad(deg) {
return deg * (Math.PI/180);
}


// Function to fetch parks near a location
function fetchParks(lat, lon) {
showLoading(true);
const overpassUrl = 'https://overpass-api.de/api/interpreter';

// Enhanced query to include filter-relevant tags
const overpassQuery = `
[out:json];
(
    // Basic parks
    node["leisure"="park"](around:5000, ${lat}, ${lon});
    way["leisure"="park"](around:5000, ${lat}, ${lon});
    relation["leisure"="park"](around:5000, ${lat}, ${lon});
    
    // Easy trails/paths
    way["highway"="path"]["sac_scale"="hiking"](around:5000, ${lat}, ${lon});
    way["highway"="path"]["trail_visibility"="excellent"](around:5000, ${lat}, ${lon});
    
    // Kid-friendly areas
    node["playground"="yes"](around:5000, ${lat}, ${lon});
    way["playground"="yes"](around:5000, ${lat}, ${lon});
    node["leisure"="playground"](around:5000, ${lat}, ${lon});
    way["leisure"="playground"](around:5000, ${lat}, ${lon});
    
    // Camping areas
    node["tourism"="camp_site"](around:5000, ${lat}, ${lon});
    way["tourism"="camp_site"](around:5000, ${lat}, ${lon});
    
    // Dog-friendly areas
    node["dog"="yes"](around:5000, ${lat}, ${lon});
    way["dog"="yes"](around:5000, ${lat}, ${lon});
    node["dogs"="yes"](around:5000, ${lat}, ${lon});
    way["dogs"="yes"](around:5000, ${lat}, ${lon});
    node["dog_park"="yes"](around:5000, ${lat}, ${lon});
    way["dog_park"="yes"](around:5000, ${lat}, ${lon});
);
out body;
>;
out skel qt;
`;

fetch(overpassUrl, {
method: 'POST',
headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
},
body: `data=${encodeURIComponent(overpassQuery)}`
})
.then(response => response.json())
.then(data => processParkData(data, lat, lon))
.catch(error => {
console.error('Error fetching parks:', error);
alert("Failed to fetch park data. Please try again.");
showLoading(false);
});
}       
// Function to add a park marker to the map
function addParkMarker(place) {
const parkIcon = L.icon({
iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
iconSize: [25, 41],
iconAnchor: [12, 41],
popupAnchor: [1, -34],
shadowSize: [41, 41]
});

let popupContent = `<div class="park-name">${place.name}</div>`;

if (place.amenities && place.amenities.length > 0) {
popupContent += `<div>Amenities: ${place.amenities.join(', ')}</div>`;
}

// Add distance information
if (place.distance) {
const distanceKm = place.distance.toFixed(1);
popupContent += `<div>Distance: ${distanceKm} km</div>`;
}
;

const marker = L.marker([place.lat, place.lon], {icon: parkIcon}).addTo(map)
.bindPopup(popupContent);

// Store place data with marker for filtering
marker.place = place;
markers.push(marker);
}

// Function to clear all markers from the map except the user location
function clearMarkers() {
    markers.forEach(marker => marker.remove());
    markers = [];
}

// Function to show/hide loading indicator
function showLoading(show) {
    document.getElementById('loading-indicator').style.display = show ? 'block' : 'none';
}

// Function to start hiking (placeholder for now)
function startHiking(lat, lon, parkName) {
    alert(`Starting hike at ${parkName}. This feature will be implemented in the next phase.`);
}

// Filter button interactivity
// Initialize filter functionality
function initFilters() {
// Update filter buttons with data attributes
document.querySelectorAll('.filter-button').forEach(button => {
// Set data-filter attribute to the button text
button.setAttribute('data-filter', button.textContent.trim());

button.addEventListener('click', function() {
    this.classList.toggle('selected');
    applyFilters();
});
});
}

// Apply filters to markers
function applyFilters() {
clearMarkers();

if (!window.allPlaces) return;

// Get selected filters
const selectedFilters = Array.from(document.querySelectorAll('.filter-button.selected'))
.map(btn => btn.textContent.trim());

// Filter places based on selected criteria
const filteredPlaces = window.allPlaces.filter(place => {
if (selectedFilters.length === 0) {
    return true;
}

// Check if place meets all selected filter criteria
return selectedFilters.every(filter => place.filters[filter]);
});

// Add markers for filtered places
filteredPlaces.forEach(place => {
addParkMarker(place);
});
}

// Initialize everything when the page loads
window.onload = initMap;