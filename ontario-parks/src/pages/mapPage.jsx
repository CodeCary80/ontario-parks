// src/pages/mapPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/mapPage.css';
import trailData from '../data/trailData';

const MapPage = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [userMarker, setUserMarker] = useState(null);
  const [allPlaces, setAllPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState([]);

  const handleTrailClick = (trailId) => {
    navigate(`/trail/${trailId}`);
  };

  // Initialize map on component mount
  useEffect(() => {
    if (!mapRef.current) return;

    // Create map centered on default location
    const mapInstance = L.map(mapRef.current).setView([43.7, -79.4], 12);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    setMap(mapInstance);

    // Automatically locate user on initial load
    locateUser(mapInstance);

    // Cleanup on component unmount
    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, []);

  // Function to locate the user and find nearby parks
  const locateUser = async (mapInstance = map) => {
    if (!mapInstance) return;
    
    setLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = [position.coords.latitude, position.coords.longitude];
          mapInstance.setView(userLocation, 14);
          
          // Remove previous user marker if it exists
          if (userMarker) {
            userMarker.remove();
          }
          
          // Add a marker for the user's location
          const newUserMarker = L.marker(userLocation).addTo(mapInstance)
            .bindPopup('You are here!')
            .openPopup();
          
          setUserMarker(newUserMarker);
          
          // Fetch parks near the user's location
          fetchParks(userLocation[0], userLocation[1], mapInstance);
          
          // Also add the sample trails for testing
          addSampleTrails(mapInstance);
        },
        (error) => {
          console.error("Error getting your location:", error);
          alert("Error getting your location: " + error.message);
          setLoading(false);
          
          // If geolocation fails, show sample trails
          addSampleTrails(mapInstance);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setLoading(false);
      
      // If geolocation not supported, show sample trails
      addSampleTrails(mapInstance);
    }
  };
  
  // Function to add sample trails from trailData
  const addSampleTrails = (mapInstance) => {
    // Use the sample data for trails
    const sampleLocations = [
      { id: 1, lat: 43.72, lon: -79.35, name: "Whiskey Rapids Trail", type: "trail" },
      { id: 2, lat: 43.68, lon: -79.42, name: "Beaver Pond Trail", type: "trail" },
      { id: 3, lat: 43.65, lon: -79.38, name: "Lookout Trail", type: "trail" }
    ];
    
    sampleLocations.forEach(place => {
      // Find matching trail from trailData
      const trail = trailData.find(t => t.id === place.id);
      if (trail) {
        const placeMock = {
          id: trail.id,
          lat: place.lat,
          lon: place.lon,
          name: trail.name,
          amenities: ["Sample Trail", trail.level],
          filters: {
            'Easy': trail.level === 'Easy',
            'Kid Friendly': Math.random() > 0.5,
            'Camping': Math.random() > 0.7,
            'Dog Friendly': Math.random() > 0.6
          },
          distance: Math.random() * 5
        };
        addParkMarker(placeMock, mapInstance);
      }
    });
  };

  // Function to search for parks in a specific location
  const searchParks = (event) => {
    event.preventDefault();
    const query = document.getElementById('search-input').value;
    if (!query) {
      alert("Please enter a location.");
      return;
    }
    
    setLoading(true);
    
    // Clear existing markers
    clearMarkers();
    
    // Use Nominatim API to geocode the search query
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
      .then(response => response.json())
      .then(data => {
        if (data.length === 0) {
          alert("Location not found. Please try again.");
          setLoading(false);
          return;
        }
        
        const location = data[0]; // Use the first result
        const lat = parseFloat(location.lat);
        const lon = parseFloat(location.lon);
        
        // Center the map on the searched location
        map.setView([lat, lon], 14);
        
        // Fetch parks near the searched location
        fetchParks(lat, lon, map);
      })
      .catch(error => {
        console.error('Error fetching location:', error);
        alert("Failed to fetch location. Please try again.");
        setLoading(false);
      });
  };

  // Function to fetch parks near a location
  const fetchParks = (lat, lon, mapInstance = map) => {
    if (!mapInstance) return;
    
    setLoading(true);
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
    .then(data => processParkData(data, lat, lon, mapInstance))
    .catch(error => {
      console.error('Error fetching parks:', error);
      alert("Failed to fetch park data. Using sample trails instead.");
      setLoading(false);
      addSampleTrails(mapInstance);
    });
  };

  // Process the returned park data
  const processParkData = (data, userLat, userLon, mapInstance = map) => {
    if (!mapInstance) return;
    
    clearMarkers();
    
    if (data.elements.length === 0) {
      alert("No parks or trails found nearby. Using sample trails instead.");
      setLoading(false);
      addSampleTrails(mapInstance);
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
        if (!element.center) return; // Skip if center is not defined
        lat = element.center.lat;
        lon = element.center.lon;
      } else {
        return; // Skip if no coordinates
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
        // Find the existing place
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
    
    // Sort places by distance
    processedPlaces.sort((a, b) => a.distance - b.distance);
    
    // Store the processed data
    setAllPlaces(processedPlaces);
    
    // Add markers to map based on current filters
    applyFilters(processedPlaces, selectedFilters, mapInstance);
    
    setLoading(false);
  };

  // Helper function to calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  // Add a park marker to the map
  const addParkMarker = (place, mapInstance = map) => {
    if (!mapInstance) return;
    
    const parkIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    
    // Generate a unique ID for the button
    const buttonId = `trail-btn-${place.id}`;
    
    let popupContent = `<div class="park-name">${place.name}</div>`;
    
    if (place.amenities && place.amenities.length > 0) {
      popupContent += `<div>Amenities: ${place.amenities.join(', ')}</div>`;
    }
    
    // Add distance information
    if (place.distance) {
      const distanceKm = place.distance.toFixed(1);
      popupContent += `<div>Distance: ${distanceKm} km</div>`;
    }
    
    popupContent += `
      <div style="margin-top: 8px;">
        <button id="${buttonId}" 
                style="background-color: rgb(121, 146, 106); color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
          View Trail Details
        </button>
      </div>
    `;
    
    const marker = L.marker([place.lat, place.lon], {icon: parkIcon})
      .addTo(mapInstance)
      .bindPopup(popupContent);
    
    // Add event listener to the popup when it opens
    marker.on('popupopen', () => {
      setTimeout(() => {
        const button = document.getElementById(buttonId);
        if (button) {
          button.addEventListener('click', () => {
            handleTrailClick(place.id);
          });
        }
      }, 0);
    });
    
    // Store place data with marker for filtering
    marker.place = place;
    setMarkers(prevMarkers => [...prevMarkers, marker]);
    
    return marker;
  };

  // Clear all markers from the map except the user location
  const clearMarkers = () => {
    markers.forEach(marker => marker.remove());
    setMarkers([]);
  };

  // Toggle filter selection
  const toggleFilter = (filterName) => {
    setSelectedFilters(prevFilters => {
      if (prevFilters.includes(filterName)) {
        // Remove filter if already selected
        const newFilters = prevFilters.filter(f => f !== filterName);
        applyFilters(allPlaces, newFilters);
        return newFilters;
      } else {
        // Add filter if not selected
        const newFilters = [...prevFilters, filterName];
        applyFilters(allPlaces, newFilters);
        return newFilters;
      }
    });
  };

  // Apply filters to markers
  const applyFilters = (places = allPlaces, filters = selectedFilters, mapInstance = map) => {
    if (!mapInstance || !places) return;
    
    clearMarkers();
    
    // Filter places based on selected criteria
    const filteredPlaces = places.filter(place => {
      // If no filters are selected, show all places
      if (filters.length === 0) {
        return true;
      }
      
      // Check if place meets all selected filter criteria
      return filters.every(filter => place.filters[filter]);
    });
    
    // Add markers for filtered places
    filteredPlaces.forEach(place => addParkMarker(place, mapInstance));
  };

  return (
    <div className="map-page">
      <div className="header">
        <div className="header-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          </svg>
        </div>
        <div className="header-title">Map</div>
      </div>
      
      <div className="map-container">
        <div id="map" ref={mapRef}></div>
        
        {loading && (
          <div className="loading">Finding parks...</div>
        )}
        
        <button 
          id="locate-me" 
          title="Find my location"
          onClick={() => locateUser()}
        >
          📍
        </button>
        
        <div className="search-container">
          <form className="search-bar" onSubmit={searchParks}>
            <div className="search-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input 
              type="text" 
              className="search-input" 
              id="search-input" 
              placeholder="Find Parks..."
            />
            <div 
              className="filter-icon" 
              onClick={() => setFilterVisible(!filterVisible)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="21" x2="4" y2="14"></line>
                <line x1="4" y1="10" x2="4" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12" y2="3"></line>
                <line x1="20" y1="21" x2="20" y2="16"></line>
                <line x1="20" y1="12" x2="20" y2="3"></line>
                <line x1="1" y1="14" x2="7" y2="14"></line>
                <line x1="9" y1="8" x2="15" y2="8"></line>
                <line x1="17" y1="16" x2="23" y2="16"></line>
              </svg>
            </div>
          </form>
          
          {filterVisible && (
            <div className="filter-buttons">
              <button 
                className={`filter-button ${selectedFilters.includes('Easy') ? 'selected' : ''}`}
                onClick={() => toggleFilter('Easy')}
              >
                Easy
              </button>
              <button 
                className={`filter-button ${selectedFilters.includes('Kid Friendly') ? 'selected' : ''}`}
                onClick={() => toggleFilter('Kid Friendly')}
              >
                Kid Friendly
              </button>
              <button 
                className={`filter-button ${selectedFilters.includes('Camping') ? 'selected' : ''}`}
                onClick={() => toggleFilter('Camping')}
              >
                Camping
              </button>
              <button 
                className={`filter-button ${selectedFilters.includes('Dog Friendly') ? 'selected' : ''}`}
                onClick={() => toggleFilter('Dog Friendly')}
              >
                Dog Friendly
              </button>
            </div>
          )}
        </div>

        {/* Recommendations section */}
        <div className="recommendations">
          <Link to="/" className="view-trails-btn">
            Back to Trails
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MapPage;