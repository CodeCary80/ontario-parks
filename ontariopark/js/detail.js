        // Park data will be loaded from URL parameters
        let currentPark = null;
        let previewMap = null;

        // Initialize page when loaded
        window.onload = function() {
            loadParkData();
            setupEventListeners();
        };

        // Load park data from URL parameters
        function loadParkData() {
            const urlParams = new URLSearchParams(window.location.search);
            const parkDataStr = urlParams.get('park');
            
            if (parkDataStr) {
                try {
                    currentPark = JSON.parse(decodeURIComponent(parkDataStr));
                    displayParkData();
                    initializeMap();
                    generateWeatherForecast();
                    generateReviews();
                } catch (e) {
                    console.error("Error parsing park data:", e);
                    showErrorState();
                }
            } else {
                showErrorState();
            }
        }

        // Display the loaded park data
        function displayParkData() {
            if (!currentPark) return;
            
            // Set basic info
            document.getElementById('trail-name').textContent = currentPark.name;
            document.getElementById('park-location').textContent = "Ontario Park";
            document.getElementById('distance').textContent = `${(currentPark.distance || 0).toFixed(1)} km away`;
            
            // Set random estimated time (5-10 mins per km)
            const estimatedMinutes = Math.round((currentPark.distance || 1) * (5 + Math.random() * 5));
            document.getElementById('time').textContent = `${estimatedMinutes} mins`;
            
            // Set random elevation (50-200m)
            const elevation = 50 + Math.round(Math.random() * 150);
            document.getElementById('elevation').textContent = `${elevation} m`;
            
            // Set difficulty based on tags or random
            const difficultyElem = document.getElementById('difficulty');
            if (currentPark.tags.includes("Easy")) {
                difficultyElem.textContent = "Easy";
                difficultyElem.className = "difficulty";
            } else if (currentPark.tags.includes("Moderate")) {
                difficultyElem.textContent = "Moderate";
                difficultyElem.className = "difficulty moderate";
            } else if (currentPark.tags.includes("Difficult")) {
                difficultyElem.textContent = "Difficult";
                difficultyElem.className = "difficulty hard";
            } else {
                const difficulties = ["Easy", "Moderate", "Difficult"];
                const randomDiff = difficulties[Math.floor(Math.random() * difficulties.length)];
                difficultyElem.textContent = randomDiff;
                difficultyElem.className = `difficulty ${randomDiff.toLowerCase()}`;
            }
            
            document.getElementById('hero-image').style.backgroundImage = `url('${currentPark.image}')`;
            
            const featuresContainer = document.getElementById('features-container');
            featuresContainer.innerHTML = '';
            currentPark.tags.forEach(tag => {
                const feature = document.createElement('div');
                feature.className = 'feature-tag';
                feature.textContent = tag;
                featuresContainer.appendChild(feature);
            });
            
            document.getElementById('info-section').innerHTML = `
                <p>For more information please visit <a href="https://www.ontarioparks.com/search?q=${encodeURIComponent(currentPark.name)}" target="_blank">Ontario Parks website</a></p>
            `;
        }

        // Initialize the map with the park's location
        function initializeMap() {
            if (!currentPark) return;
            
            previewMap = L.map('preview-map').setView([currentPark.lat, currentPark.lng], 13);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '©️ OpenStreetMap contributors'
            }).addTo(previewMap);
            
            // Add a marker for the park
            L.marker([currentPark.lat, currentPark.lng]).addTo(previewMap)
                .bindPopup(currentPark.name).openPopup();
            
            // Add a simple circular area around the park
            L.circle([currentPark.lat, currentPark.lng], {
                color: '#4CAF50',
                fillColor: '#4CAF50',
                fillOpacity: 0.2,
                radius: 500
            }).addTo(previewMap);
            
            // Disable map interactions for preview
            previewMap.dragging.disable();
            previewMap.touchZoom.disable();
            previewMap.doubleClickZoom.disable();
            previewMap.scrollWheelZoom.disable();
        }

        // Generate a random weather forecast
        function generateWeatherForecast() {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const weatherIcons = ['☀️', '⛅', '☁️', '🌧️', '🌦️', '❄️'];
            const forecastContainer = document.getElementById('weather-forecast');
            forecastContainer.innerHTML = '';
            
            const today = new Date();
            
            for (let i = 0; i < 7; i++) {
                const date = new Date();
                date.setDate(today.getDate() + i);
                const dayName = days[date.getDay()];
                const isToday = i === 0;
                
                const temp = Math.round(15 + Math.random() * 15); // 15-30°C
                const icon = weatherIcons[Math.floor(Math.random() * weatherIcons.length)];
                
                const dayElem = document.createElement('div');
                dayElem.className = `weather-day ${isToday ? 'current-day' : ''}`;
                dayElem.innerHTML = `
                    <div class="day-name">${dayName}</div>
                    <div class="temp-circle">
                        ${i % 3 === 0 ? `<div class="weather-icon">${icon}</div>` : ''}
                        <div class="day-temp">${temp}°</div>
                    </div>
                    ${isToday ? `
                    <div class="time-info">
                        <div>↑ 07:04</div>
                        <div>↓ 17:52</div>
                    </div>
                    ` : ''}
                `;
                
                forecastContainer.appendChild(dayElem);
            }
        }

        // Generate random reviews
        function generateReviews() {
            const reviews = [
                {
                    name: "Alex Johnson",
                    rating: 4,
                    tags: ["Scenic", "Peaceful", "Well-maintained"],
                    content: "Beautiful trail with amazing views. Perfect for a weekend hike with family."
                },
                {
                    name: "Sam Wilson",
                    rating: 5,
                    tags: ["Challenging", "Rewarding", "Great workout"],
                    content: "One of my favorite trails in the area. The elevation gain makes it a good workout."
                },
                {
                    name: "Taylor Smith",
                    rating: 3,
                    tags: ["Crowded", "Noisy", "Accessible"],
                    content: "Nice trail but too many people on weekends. Go early if you want peace."
                }
            ];
            
            const reviewsContainer = document.getElementById('reviews-container');
            reviewsContainer.innerHTML = '';
            
            const avgRating = (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1);
            document.getElementById('review-count').textContent = `${avgRating}/5`;
            
            // Create review elements
            reviews.forEach(review => {
                const reviewElem = document.createElement('div');
                reviewElem.className = 'review-item';
                
                reviewElem.innerHTML = `
                    <div class="reviewer">
                        <div class="reviewer-avatar">
                            <img src="https://api.dicebear.com/6.x/avataaars/svg?seed=${encodeURIComponent(review.name)}" alt="${review.name}">
                        </div>
                        <div class="reviewer-info">
                            <div class="reviewer-name">${review.name}</div>
                            <div class="reviewer-rating">
                                ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                            </div>
                        </div>
                    </div>
                    <div class="reviewer-tags">
                        ${review.tags.map(tag => `<div class="reviewer-tag">${tag}</div>`).join('')}
                    </div>
                    <div class="review-content">
                        ${review.content}
                    </div>
                `;
                
                reviewsContainer.appendChild(reviewElem);
            });
        }

        // Generate a static map image URL using OpenStreetMap
        function getStaticMapUrl(lat, lng, zoom = 13, width = 800, height = 600) {
            return `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=${width}&height=${height}&center=lonlat:${lng},${lat}&zoom=${zoom}&marker=lonlat:${lng},${lat};type:material;color:%23ff0000;size:medium&apiKey=1466d50b23a841fb85c7fcd5b15f11e3`;
            
        }

        // Generate a simple GPX file for the trail
        function generateGPXFile(lat, lng, trailName) {
            const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Trail Explorer" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${trailName}</name>
    <desc>Trail route for ${trailName}</desc>
  </metadata>
  <wpt lat="${lat}" lon="${lng}">
    <name>Trail Start</name>
  </wpt>
  <trk>
    <name>${trailName}</name>
    <trkseg>
      <trkpt lat="${lat}" lon="${lng}"></trkpt>
      <trkpt lat="${lat + 0.002}" lon="${lng + 0.002}"></trkpt>
      <trkpt lat="${lat + 0.004}" lon="${lng + 0.001}"></trkpt>
      <trkpt lat="${lat + 0.006}" lon="${lng - 0.001}"></trkpt>
      <trkpt lat="${lat + 0.008}" lon="${lng - 0.003}"></trkpt>
    </trkseg>
  </trk>
</gpx>`;
            return new Blob([gpxContent], { type: 'application/gpx+xml' });
        }

        // Download a static map image
        async function downloadMapImage() {
            if (!currentPark) return;
            
            try {
                const downloadButton = document.getElementById('download-button');
                downloadButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"></path>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                    </svg>
                    Generating Map...
                `;
                
                const mapElement = document.getElementById('preview-map');
                const canvas = await html2canvas(mapElement);
                
                canvas.toBlob(function(blob) {
                    saveAs(blob, `${currentPark.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_map.png`);
                    
                    downloadButton.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        Map Downloaded
                    `;
                    
                    const toast = document.getElementById('download-toast');
                    toast.textContent = "Map image downloaded successfully!";
                    toast.style.display = 'block';
                    setTimeout(() => toast.style.display = 'none', 3000);
                });
            } catch (error) {
                console.error("Error downloading map:", error);
                const toast = document.getElementById('download-toast');
                toast.textContent = "Error downloading map. Please try again.";
                toast.style.display = 'block';
                setTimeout(() => toast.style.display = 'none', 3000);
                
                // Reset button
                const downloadButton = document.getElementById('download-button');
                downloadButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Map Download
                `;
            }
        }

        // Download a GPX file
        function downloadGPXFile() {
            if (!currentPark) return;
            
            try {
                const gpxBlob = generateGPXFile(currentPark.lat, currentPark.lng, currentPark.name);
                saveAs(gpxBlob, `${currentPark.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_trail.gpx`);
                
                const toast = document.getElementById('download-toast');
                toast.textContent = "GPX file downloaded successfully!";
                toast.style.display = 'block';
                setTimeout(() => toast.style.display = 'none', 3000);
            } catch (error) {
                console.error("Error downloading GPX:", error);
                const toast = document.getElementById('download-toast');
                toast.textContent = "Error downloading GPX file. Please try again.";
                toast.style.display = 'block';
                setTimeout(() => toast.style.display = 'none', 3000);
            }
        }

        // Setup all event listeners
        function setupEventListeners() {
            document.getElementById('rating-stars').addEventListener('click', function() {
                document.getElementById('reviews').scrollIntoView({ behavior: 'smooth' });
            });
            
            document.getElementById('download-button').addEventListener('click', function() {
                document.getElementById('download-modal').style.display = 'flex';
            });
            
            document.getElementById('download-image').addEventListener('click', function() {
                downloadMapImage();
                document.getElementById('download-modal').style.display = 'none';
            });
            
            document.getElementById('download-gpx').addEventListener('click', function() {
                downloadGPXFile();
                document.getElementById('download-modal').style.display = 'none';
            });
            
            document.getElementById('download-close').addEventListener('click', function() {
                document.getElementById('download-modal').style.display = 'none';
            });
            
            document.getElementById('preview-button').addEventListener('click', function() {
                const videoOverlay = document.getElementById('video-overlay');
                const video = document.getElementById('preview-video');
                
                videoOverlay.style.display = 'flex';
                
                video.play().catch(e => {
                    console.error("Video play failed:", e);
                    alert("Could not play the video. Please ensure you have a video file named 'preview.mp4' in the same directory.");
                });
            });
            
            document.getElementById('close-video').addEventListener('click', function() {
                const videoOverlay = document.getElementById('video-overlay');
                const video = document.getElementById('preview-video');
                
                video.pause();
                
                videoOverlay.style.display = 'none';
            });
            
            // Begin trail button functionality
            document.getElementById('begin-trail-button').addEventListener('click', function() {
                if (currentPark) {
                    window.location.href = `navigationPage.html?trail=${encodeURIComponent(currentPark.name)}`;
                } else {
                    window.location.href = "navigationPage.html";
                }
            });
            
            document.addEventListener('click', function(e) {
                if (e.target.classList.contains('feature-tag') || 
                    e.target.classList.contains('reviewer-tag')) {
                    e.target.classList.toggle('selected-filter');
                }
            });
            
            document.getElementById('video-overlay').addEventListener('click', function(e) {
                if (e.target === this) {
                    const video = document.getElementById('preview-video');
                    video.pause();
                    this.style.display = 'none';
                }
            });
            
            document.getElementById('download-modal').addEventListener('click', function(e) {
                if (e.target === this) {
                    this.style.display = 'none';
                }
            });
        }

        function showErrorState() {
            document.getElementById('trail-name').textContent = "Park Not Found";
            document.getElementById('park-location').textContent = "Unknown Location";
            document.getElementById('info-section').innerHTML = 
                '<p>Could not load park information. Please try again later.</p>';
        };