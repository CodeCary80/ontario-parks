// src/pages/TrailDetailsPage.jsx
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import '../styles/TrailDetailsPage.css';
import trailData from '../data/trailData';

function TrailDetailsPage() {
    const { id } = useParams();
    // Convert ID to number since URL params are strings
    const parsedId = parseInt(id, 10);
    
    const trail = trailData.find(t => t.id === parsedId);
    
    if (!trail) {
      return (
        <div className="trail-not-found">
          <header>
            <h1>Trail Not Found</h1>
          </header>
          <div className="content">
            <p>We couldn't find a trail with ID: {id}</p>
            <p>This might be because the ID is invalid or the trail has been removed.</p>
            <div className="navigation-buttons">
              <Link to="/" className="nav-button">
                Back to Trails
              </Link>
              <Link to="/map" className="nav-button">
                View Map
              </Link>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="trail-details-page">
        <header>
          <h1>Trail Details</h1>
        </header>
        
        <div className="trail-image-container">
          <img 
            src={trail.image || "https://via.placeholder.com/800x400/a0a0a0/fff?text=Trail+Image"} 
            alt={trail.name} 
            className="trail-header-image" 
          />
        </div>
        
        <div className="trail-title">
          <h1>{trail.name}</h1>
          <p>{trail.park} • {trail.level}</p>
          <div className="rating">
            ★★★★☆
          </div>
        </div>
        
        <div className="trail-stats">
          <div className="stat">
            <h3>Estimated</h3>
            <p>{trail.time}</p>
          </div>
          <div className="stat">
            <h3>Distance</h3>
            <p>{trail.distance}</p>
          </div>
          <div className="stat">
            <h3>Elevation</h3>
            <p>81 m</p>
          </div>
        </div>
        
        <div className="trail-features">
          <span className="feature">Kid-Friendly</span>
          <span className="feature">Dog unleash</span>
          <span className="feature">Camping</span>
          <span className="feature">Canoeing</span>
          <span className="feature">Toilets</span>
        </div>
        
        <div className="trail-map">
          <img 
            src="https://via.placeholder.com/800x200/d0d0d0/333?text=Trail+Map" 
            alt="Trail Map" 
          />
        </div>
        
        <div className="trail-actions">
          <button className="action-btn">Preview trail</button>
          <Link to="/map" className="action-btn">
            Direction
          </Link>
        </div>
        
        <div className="info-link">
          <p>For more information please visit</p>
          <a href="https://www.ontarioparks.ca/park/algonquin">
            https://www.ontarioparks.ca/park/algonquin
          </a>
        </div>
        
        <div className="navigation-buttons">
          <Link to="/" className="nav-button">
            Back to Trails
          </Link>
          <Link to="/map" className="nav-button">
            View Map
          </Link>
        </div>
      </div>
    );
}

export default TrailDetailsPage;