        // Global variables
        let userLocation = null;
        let allParks = [];
        let currentView = 'all'; // 'all' or 'saved'
        
        // Fallback data for when API fails
        const fallbackParks = [
            {
                id: 1,
                name: "Algonquin Provincial Park",
                lat: 45.5926,
                lng: -78.3657,
                distance: 250,
                tags: ["Camping", "Hiking", "Scenic Views", "Waterfront"],
                image: "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60"
            },
            {
                id: 2,
                name: "Killarney Provincial Park",
                lat: 46.0389,
                lng: -81.4067,
                distance: 350,
                tags: ["Camping", "Hiking", "Scenic Views", "Dog Friendly"],
                image: "https://images.unsplash.com/photo-1550236520-7050f3582da0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60"
            },
            {
                id: 3,
                name: "Sandbanks Provincial Park",
                lat: 43.9084,
                lng: -77.2343,
                distance: 200,
                tags: ["Waterfront", "Swimming", "Kid Friendly", "Camping"],
                image: "https://images.unsplash.com/photo-1552083375-1447ce886485?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60"
            },
            {
                id: 4,
                name: "Bruce Peninsula National Park",
                lat: 45.2415,
                lng: -81.6296,
                distance: 300,
                tags: ["Hiking", "Scenic Views", "Waterfront", "Camping"],
                image: "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60"
            }
        ];

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function() {
            // Set up filter chips
            document.querySelectorAll('.filter-chip').forEach(chip => {
                chip.addEventListener('click', function() {
                    this.classList.toggle('selected');
                    filterParkCards();
                });
            });
            
            // Set up search
            document.getElementById('search-input').addEventListener('input', filterParkCards);
            
            // Set up navigation
            setupNavigation();
            
            // Locate user and fetch parks
            locateUser();
        });

        // Set up navigation event listeners
        function setupNavigation() {
            document.getElementById('nav-search').addEventListener('click', function(e) {
                e.preventDefault();
                setActiveNav('nav-search');
                currentView = 'all';
                document.getElementById('header-title').textContent = 'Parks Near You';
                filterParkCards();
            });
            
            document.getElementById('nav-explore').addEventListener('click', function(e) {
                e.preventDefault();
                setActiveNav('nav-explore');
                // Future functionality
            });
            
            document.getElementById('nav-saved').addEventListener('click', function(e) {
                e.preventDefault();
                setActiveNav('nav-saved');
                currentView = 'saved';
                document.getElementById('header-title').textContent = 'Saved Parks';
                showSavedParks();
            });
            
            document.getElementById('nav-profile').addEventListener('click', function(e) {
                e.preventDefault();
                setActiveNav('nav-profile');
                // Future functionality
            });
        }

        // Set active navigation item
        function setActiveNav(activeId) {
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            document.getElementById(activeId).classList.add('active');
        }

        // Show only saved parks
        function showSavedParks() {
            const savedParkIds = getSavedParkIds();
            const parksToShow = (allParks.length > 0 ? allParks : fallbackParks).filter(park => 
                savedParkIds.includes(park.id.toString())
            );
            
            if (parksToShow.length === 0) {
                showStatusMessage("You haven't saved any parks yet", "info");
            } else {
                renderParkCards(parksToShow);
            }
        }

        // Get saved park IDs from localStorage
        function getSavedParkIds() {
            const saved = localStorage.getItem('savedParks');
            return saved ? JSON.parse(saved) : [];
        }

        // Save a park to localStorage
        function savePark(parkId) {
            const saved = getSavedParkIds();
            if (!saved.includes(parkId)) {
                saved.push(parkId);
                localStorage.setItem('savedParks', JSON.stringify(saved));
            }
        }

        // Remove a park from saved in localStorage
        function unsavePark(parkId) {
            const saved = getSavedParkIds();
            const updated = saved.filter(id => id !== parkId);
            localStorage.setItem('savedParks', JSON.stringify(updated));
        }

        // Get user location with improved error handling
        function locateUser() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        userLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        showStatusMessage("Finding parks near you...", "loading");
                        fetchNearbyParks();
                    },
                    error => {
                        console.warn("Geolocation error:", error);
                        userLocation = { lat: 43.7, lng: -79.4 }; // Default to Toronto
                        showStatusMessage("Using default location (Toronto area)", "info");
                        fetchNearbyParks();
                    },
                    { 
                        timeout: 10000, // 10 second timeout
                        maximumAge: 600000, // Accept cached position up to 10 minutes old
                        enableHighAccuracy: true 
                    }
                );
            } else {
                console.warn("Geolocation not supported");
                userLocation = { lat: 43.7, lng: -79.4 };
                showStatusMessage("Geolocation not supported. Showing sample parks.", "info");
                renderParkCards(fallbackParks);
            }
        }

        // Fetch parks with better error handling
        function fetchNearbyParks() {
            const radius = 10000; // 10km radius
            const overpassQuery = `
                [out:json];
                (
                    node["leisure"="park"](around:${radius},${userLocation.lat},${userLocation.lng});
                    way["leisure"="park"](around:${radius},${userLocation.lat},${userLocation.lng});
                    relation["leisure"="park"](around:${radius},${userLocation.lat},${userLocation.lng});
                    
                    // Additional queries for better results
                    node["tourism"="camp_site"](around:${radius},${userLocation.lat},${userLocation.lng});
                    way["tourism"="camp_site"](around:${radius},${userLocation.lat},${userLocation.lng});
                    
                    node["natural"="wood"](around:${radius},${userLocation.lat},${userLocation.lng});
                    way["natural"="wood"](around:${radius},${userLocation.lat},${userLocation.lng});
                );
                out body;
                >;
                out skel qt;
            `;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

            fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `data=${encodeURIComponent(overpassQuery)}`,
                signal: controller.signal
            })
            .then(response => {
                clearTimeout(timeoutId);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (!data.elements || data.elements.length === 0) {
                    throw new Error("No parks found in this area");
                }
                allParks = processParkData(data.elements);
                if (allParks.length === 0) {
                    throw new Error("No valid park data found");
                }
                renderParkCards(allParks);
            })
            .catch(error => {
                console.error("API Error:", error);
                showStatusMessage(`Showing sample parks. (${error.message})`, "info");
                renderParkCards(fallbackParks);
            });
        }

        // Process raw park data
        function processParkData(elements) {
        const processedParks = [];
        const seenParkNames = new Set();

        elements.forEach(element => {
            try {
                if (!element.tags || !element.tags.name) return;
                
                // Get coordinates
                let coords;
                if (element.type === 'node') {
                    coords = { lat: element.lat, lng: element.lon };
                } else if (element.center) {
                    coords = { lat: element.center.lat, lng: element.center.lon };
                } else {
                    return; // Skip if no coordinates
                }
                
                // Skip duplicates
                const parkName = element.tags.name.trim();
                if (seenParkNames.has(parkName)) return;
                seenParkNames.add(parkName);
                
                // Calculate distance
                const distance = calculateDistance(
                    userLocation.lat, 
                    userLocation.lng, 
                    coords.lat, 
                    coords.lng
                );
                
                // Determine tags - now with random assignment
                const tags = [];
                
                // Randomly assign all filter tags with different probabilities
                if (Math.random() < 0.4) tags.push("Easy");              
                if (Math.random() < 0.3) tags.push("Kid Friendly");       
                if (Math.random() < 0.25) tags.push("Camping");          
                if (Math.random() < 0.35) tags.push("Dog Friendly");     
                if (Math.random() < 0.2) tags.push("Waterfront");        
                if (Math.random() < 0.25) tags.push("Scenic Views");     
                
                // Still keep original tags from OSM data if they exist
                if (element.tags.leisure === 'park') tags.push("Park");
                if (element.tags.tourism === 'camp_site') tags.push("Camping");
                if (element.tags.playground === 'yes') tags.push("Kid Friendly");
                if (element.tags.dog === 'yes') tags.push("Dog Friendly");
                if (element.tags.water === 'lake') tags.push("Waterfront");
                if (element.tags.natural === 'wood') tags.push("Forest");
                
                // Ensure no duplicate tags
                const uniqueTags = [...new Set(tags)];
                
                // Add park data
                processedParks.push({
                    id: element.id || Math.random().toString(36).substr(2, 9),
                    name: parkName,
                    lat: coords.lat,
                    lng: coords.lng,
                    distance: distance,
                    tags: uniqueTags.length > 0 ? uniqueTags : ["Park"],
                    image: getRandomParkImage()
                });
            } catch (e) {
                console.warn("Error processing park element:", e);
            }
        });
        
        return processedParks.sort((a, b) => a.distance - b.distance);
    }

        // Calculate distance between coordinates in km
        function calculateDistance(lat1, lng1, lat2, lng2) {
            const R = 6371; // Earth's radius in km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLng = (lng2 - lng1) * Math.PI / 180;
            const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        }

        // Get random park image from our collection
        function getRandomParkImage() {
            const images = [
                'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
                'https://images.unsplash.com/photo-1550236520-7050f3582da0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
                'https://images.unsplash.com/photo-1552083375-1447ce886485?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
                'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
                'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
            ];
            return images[Math.floor(Math.random() * images.length)];
        }

        // Show status message
        function showStatusMessage(message, type = "info") {
            const container = document.getElementById('parks-container');
            container.innerHTML = `<div class="status-message ${type}-message">${message}</div>`;
        }

        // Render park cards
        function renderParkCards(parks) {
            const container = document.getElementById('parks-container');
            
            if (!parks || parks.length === 0) {
                showStatusMessage("No parks found in this area", "info");
                return;
            }
            
            container.innerHTML = '';
            const parksContainer = document.createElement('div');
            parksContainer.className = 'parks-container';
            
            const savedParkIds = getSavedParkIds();
            
            parks.forEach(park => {
                const isSaved = savedParkIds.includes(park.id.toString());
                const card = document.createElement('div');
                card.className = 'park-card';
                card.style.backgroundImage = `url('${park.image}')`;
                card.onclick = () => navigateToDetail(park);
                
                card.innerHTML = `
                    <div class="action-buttons">
                        <button class="circle-button favorite-btn" data-park-id="${park.id}">${isSaved ? '♥' : '♡'}</button>
                        <button class="circle-button share-btn">↗</button>
                    </div>
                    <div class="card-content">
                        <h2 class="park-name">${park.name}</h2>
                        <div class="park-detail-wrapper">
                            <div class="park-detail">${park.distance.toFixed(1)} km away</div>
                            ${park.tags.includes("Camping") ? '<div class="park-detail">🏕️ Camping available</div>' : ''}
                        </div>
                        <div class="tags-container">
                            ${park.tags.map(tag => `<div class="tag">${tag}</div>`).join('')}
                        </div>
                    </div>
                `;
                
                parksContainer.appendChild(card);
            });
            
            container.appendChild(parksContainer);
            
            // Add event listeners to new buttons
            document.querySelectorAll('.favorite-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const parkId = this.getAttribute('data-park-id');
                    
                    if (this.textContent === '♡') {
                        this.textContent = '♥';
                        savePark(parkId);
                    } else {
                        this.textContent = '♡';
                        unsavePark(parkId);
                        
                        // If we're in saved view, remove the card
                        if (currentView === 'saved') {
                            this.closest('.park-card').remove();
                            // If no cards left, show message
                            if (document.querySelectorAll('.park-card').length === 0) {
                                showStatusMessage("You haven't saved any parks yet", "info");
                            }
                        }
                    }
                });
            });
            
            document.querySelectorAll('.share-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const parkName = this.closest('.park-card').querySelector('.park-name').textContent;
                    if (navigator.share) {
                        navigator.share({
                            title: parkName,
                            text: `Check out ${parkName} in Ontario Parks!`,
                            url: window.location.href
                        }).catch(err => {
                            console.log('Error sharing:', err);
                            alert(`Share ${parkName}`);
                        });
                    } else {
                        alert(`Share ${parkName}`);
                    }
                });
            });
        }

        // Filter park cards based on search and filters
        function filterParkCards() {
            const searchTerm = document.getElementById('search-input').value.toLowerCase();
            const selectedFilters = Array.from(document.querySelectorAll('.filter-chip.selected'))
                .map(chip => chip.dataset.filter);
            
            let parksToFilter;
            if (currentView === 'saved') {
                const savedParkIds = getSavedParkIds();
                parksToFilter = (allParks.length > 0 ? allParks : fallbackParks).filter(park => 
                    savedParkIds.includes(park.id.toString())
                );
            } else {
                parksToFilter = allParks.length > 0 ? allParks : fallbackParks;
            }
            
            const filtered = parksToFilter.filter(park => {
                // Search by name
                if (searchTerm && !park.name.toLowerCase().includes(searchTerm)) {
                    return false;
                }
                
                // Filter by tags if any filters selected
                if (selectedFilters.length > 0) {
                    return selectedFilters.every(filter => 
                        park.tags.some(tag => tag.includes(filter))
                    );
                }
                
                return true;
            });
            
            if (filtered.length === 0) {
                showStatusMessage("No parks match your search criteria", "info");
            } else {
                renderParkCards(filtered);
            }
        }

        // Navigation functions
        function navigateToDetail(park) {
            // Convert the park object to a URL-safe string
            const parkDataStr = encodeURIComponent(JSON.stringify(park));
            window.location.href = `detail.html?park=${parkDataStr}`;
        }
        
        function navigateToMap() {
            console.log("Navigating to map view");
            window.location.href = 'map.html';
        }