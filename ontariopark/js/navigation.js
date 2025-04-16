let map;
let userMarker;
let destinationMarker;
let routeLine;
let isNavigating = false;
let isPaused = false;
let startTime;
let elapsedTime = 0;
let timerInterval;
let currentPosition;
let routePoints = [];
let distanceTraveled = 0;
let lastRecordedPosition = null;
let simulationMode = true; 
let simulationInterval;

// Parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const trailName = urlParams.get('trail') || 'Whiskey Rapids Trail';

// Trail information - would be fetched from a database in a real app
const trailInfo = {
    'Whiskey Rapids Trail': {
        difficulty: 'Easy',
        location: 'Algonquin Provincial Park, Toronto',
        estimatedTime: 40, // mins
        distance: 2.1, // km
        elevation: 81, // m
        center: [45.8, -78.4], // Default coords
        routePoints: [
            [45.8, -78.4], // Start
            [45.802, -78.395],
            [45.805, -78.39],
            [45.807, -78.385],
            [45.81, -78.383],
            [45.812, -78.385],
            [45.815, -78.39],
            [45.813, -78.395],
            [45.81, -78.397] // End
        ]
    },
    'Mizzy Lake Trail': {
        difficulty: 'Moderate',
        location: 'Algonquin Provincial Park, Ontario',
        estimatedTime: 300, // 5 hours in mins
        distance: 10.8, // km
        elevation: 120, // m
        center: [45.83, -78.35],
        routePoints: [
            [45.83, -78.35], // Start
            [45.835, -78.345],
            [45.84, -78.34],
            [45.845, -78.335],
            [45.85, -78.33],
            [45.855, -78.335],
            [45.86, -78.34],
            [45.865, -78.345],
            [45.87, -78.35] // End
        ]
    },
    // Add more trails as needed
};

// Initialize map when the page loads
window.onload = function() {
    initializeMap();
    updateTrailInfo();
};

function initializeMap() {
    // Get trail info or use default
    const trail = trailInfo[trailName] || trailInfo['Whiskey Rapids Trail'];
    
    // Create map centered on trail
    map = L.map('map').setView(trail.center, 15);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Store route points
    routePoints = trail.routePoints;
    
    // Add destination marker
    const destinationPosition = routePoints[routePoints.length - 1];
    destinationMarker = L.marker(destinationPosition).addTo(map)
        .bindPopup(`${trailName} End Point`);
    
    // Add route line (initially just showing the path)
    routeLine = L.polyline(routePoints, {
        color: '#E91E63',
        weight: 4,
        opacity: 0.8
    }).addTo(map);
    
    // Try to get user's location
    if (navigator.geolocation && !simulationMode) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userPosition = [position.coords.latitude, position.coords.longitude];
                currentPosition = userPosition;
                
                // Add user marker
                addUserMarker(userPosition);
                
                // Center map on user
                map.setView(userPosition, 15);
            },
            (error) => {
                console.error("Error getting location:", error);
                // Use the start of the trail as fallback
                currentPosition = routePoints[0];
                addUserMarker(currentPosition);
            }
        );
    } else {
        // Use the start of the trail for simulation
        currentPosition = routePoints[0];
        addUserMarker(currentPosition);
    }
}

function addUserMarker(position) {
    // Create custom marker for user's current location
    const userIcon = L.divIcon({
        className: 'current-location-marker',
        iconSize: [50, 50],
        iconAnchor: [25, 25]
    });
    
    // Add marker to map
    userMarker = L.marker(position, { icon: userIcon }).addTo(map);
    lastRecordedPosition = position;
}

function updateTrailInfo() {
    // Get trail info
    const trail = trailInfo[trailName] || trailInfo['Whiskey Rapids Trail'];
    
    // Update UI elements
    document.getElementById('trail-name').textContent = trailName;
    document.getElementById('difficulty').textContent = trail.difficulty;
    document.getElementById('park-location').textContent = trail.location;
    document.getElementById('remaining').textContent = `${trail.estimatedTime}`;
}

function startNavigation() {
    isNavigating = true;
    startTime = new Date();
    updateNavigationUI('start');
    
    // Start timer
    timerInterval = setInterval(updateTimer, 1000);
    
    // Update position (real or simulated)
    if (simulationMode) {
        let currentPointIndex = 0;
        
        simulationInterval = setInterval(() => {
            if (isPaused) return;
            
            // Move along route points for simulation
            currentPointIndex = (currentPointIndex + 1) % routePoints.length;
            const newPosition = routePoints[currentPointIndex];
            
            updatePosition(newPosition);
            
            // Update navigation status messages for realism
            if (currentPointIndex === Math.floor(routePoints.length / 4)) {
                document.getElementById('nav-status').textContent = "Continue straight for 500m";
            } else if (currentPointIndex === Math.floor(routePoints.length / 2)) {
                document.getElementById('nav-status').textContent = "Turn left at the fork ahead";
            } else if (currentPointIndex === Math.floor(routePoints.length * 3 / 4)) {
                document.getElementById('nav-status').textContent = "Continue on the trail for 300m";
            }
            
            // When reaching the end
            if (currentPointIndex === routePoints.length - 1) {
                document.getElementById('nav-status').textContent = "You have reached your destination!";
            }
            
        }, 2000); // Move every 2 seconds in simulation
    } else {
        // Real navigation using geolocation
        navigator.geolocation.watchPosition(
            (position) => {
                if (isPaused) return;
                
                const newPosition = [position.coords.latitude, position.coords.longitude];
                updatePosition(newPosition);
            },
            (error) => {
                console.error("Error tracking location:", error);
                document.getElementById('nav-status').textContent = "Error tracking location";
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
    }
}

function updatePosition(newPosition) {
    if (!isNavigating) return;
    
    // Update user marker position
    if (userMarker) {
        userMarker.setLatLng(newPosition);
    } else {
        addUserMarker(newPosition);
    }
    
    // Calculate distance traveled
    if (lastRecordedPosition) {
        const segmentDistance = calculateDistance(lastRecordedPosition, newPosition);
        distanceTraveled += segmentDistance;
        
        // Update distance display
        document.getElementById('distance').innerHTML = 
            `${distanceTraveled.toFixed(2)}<span style="font-size: 16px;">km</span>`;
        
        // Update pace and speed
        if (distanceTraveled > 0) {
            const timeInHours = elapsedTime / 3600; // seconds to hours
            const pace = elapsedTime / distanceTraveled / 60; // min/km
            const speed = distanceTraveled / timeInHours; // km/h
            
            // Format pace as MM:SS
            const paceMinutes = Math.floor(pace);
            const paceSeconds = Math.floor((pace - paceMinutes) * 60);
            const paceFormatted = `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}`;
            
            document.getElementById('pace').innerHTML = 
                `${paceFormatted}<span style="font-size: 16px;">/km</span>`;
            document.getElementById('speed').innerHTML = 
                `${speed.toFixed(1)}<span style="font-size: 16px;"> kph</span>`;
        }
    }
    
    // Update last position
    lastRecordedPosition = newPosition;
    
    // Center the map on the current position
    map.setView(newPosition, map.getZoom());
    
    // Calculate remaining time based on distance and current speed
    updateRemainingTime();
}

function updateRemainingTime() {
    // Get trail info
    const trail = trailInfo[trailName] || trailInfo['Whiskey Rapids Trail'];
    
    // Calculate remaining distance
    const remainingDistance = trail.distance - distanceTraveled;
    
    if (remainingDistance <= 0) {
        document.getElementById('remaining').innerHTML = 
            `0<span style="font-size: 16px;">mins</span>`;
        return;
    }
    
    // Calculate current speed in km/min
    const timeInMinutes = elapsedTime / 60; // seconds to minutes
    let currentSpeed = 0;
    
    if (timeInMinutes > 0) {
        currentSpeed = distanceTraveled / timeInMinutes; // km/min
    } else {
        // Default speed if just started
        currentSpeed = trail.distance / trail.estimatedTime; // km/min
    }
    
    // Calculate remaining time in minutes
    let remainingTime = Math.round(remainingDistance / currentSpeed);
    
    // Cap at minimum of 1 minute if we're still navigating
    if (remainingTime < 1 && remainingDistance > 0.1) {
        remainingTime = 1;
    }
    
    document.getElementById('remaining').innerHTML = 
        `${remainingTime}<span style="font-size: 16px;">mins</span>`;
}

function calculateDistance(pos1, pos2) {
    // Calculate distance between two points in km (haversine formula)
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(pos2[0] - pos1[0]);
    const dLon = deg2rad(pos2[1] - pos1[1]);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(pos1[0])) * Math.cos(deg2rad(pos2[0])) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

function updateTimer() {
    if (!isNavigating || isPaused) return;
    
    const now = new Date();
    elapsedTime = Math.floor((now - startTime) / 1000) + (elapsedTime || 0);
    
    // Format as MM:SS
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('time').textContent = timeFormatted;
}

function pauseNavigation() {
    isPaused = true;
    updateNavigationUI('pause');
    
    // Store elapsed time when paused
    const now = new Date();
    elapsedTime = Math.floor((now - startTime) / 1000);
    
    // Update navigation status
    document.getElementById('nav-status').textContent = "Navigation paused";
}

function resumeNavigation() {
    isPaused = false;
    startTime = new Date(); // Reset start time for the timer
    updateNavigationUI('resume');
    
    // Update navigation status
    document.getElementById('nav-status').textContent = "Navigation resumed";
}

function finishNavigation() {
    isNavigating = false;
    isPaused = false;
    clearInterval(timerInterval);
    
    if (simulationMode) {
        clearInterval(simulationInterval);
    }
    
    // Update navigation status
    document.getElementById('nav-status').textContent = "Navigation completed";
    
    // Navigate to the finish review page with stats
    const currentTime = document.getElementById('time').textContent;
    const currentDistance = document.getElementById('distance').textContent.replace('km', '').trim();
    const currentElevation = document.getElementById('elevation').textContent.replace('m', '').trim();
    
    window.location.href = `finish.html?trail=${encodeURIComponent(trailName)}&distance=${currentDistance}&elevation=${currentElevation}&time=${currentTime}`;
}

function updateNavigationUI(state) {
    const actionButtonsContainer = document.getElementById('action-buttons');
    
    switch(state) {
        case 'start':
            actionButtonsContainer.innerHTML = `
                <button class="action-button pause-button" onclick="pauseNavigation()">Pause</button>
                <button class="action-button finish-button" onclick="finishNavigation()">Finish</button>
            `;
            break;
            
        case 'pause':
            actionButtonsContainer.innerHTML = `
                <button class="action-button resume-button" onclick="resumeNavigation()">Resume</button>
                <button class="action-button finish-button" onclick="finishNavigation()">Finish</button>
            `;
            break;
            
        case 'resume':
            actionButtonsContainer.innerHTML = `
                <button class="action-button pause-button" onclick="pauseNavigation()">Pause</button>
                <button class="action-button finish-button" onclick="finishNavigation()">Finish</button>
            `;
            break;
            
        default:
            actionButtonsContainer.innerHTML = `
                <button class="action-button start-button" onclick="startNavigation()">Start</button>
            `;
    }
}

function resetNorth() {
    // Reset map orientation to North
    map.setBearing(0);
}

function goBack() {
    // If navigating, confirm before leaving
    if (isNavigating && !confirm("Exit navigation? Your progress will not be saved.")) {
        return;
    }
    
    // Stop all intervals
    clearInterval(timerInterval);
    if (simulationMode) {
        clearInterval(simulationInterval);
    }
    
    // Go back to detail page
    window.location.href = `selection.html`;
}