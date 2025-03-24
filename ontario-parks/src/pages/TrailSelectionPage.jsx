import { Link } from 'react-router-dom';
import React, { useState } from 'react';
import trailData from '../data/trailData';

function TrailSelectionPage() {
    const [activeTab, setActiveTab] = useState('Trails');
  
    return (
      <div className="trail-selection-page">
        <header>
          <h1>Choosing trail</h1>
        </header>
        
        <div className="content">
          <h2>Hello Sandy!</h2>
          <h1>Choose your trails</h1>
          
          {/* Trail Cards */}
          <div className="trails-container">
            {trailData.map(trail => (
              <Link to={`/trail/${trail.id}`} key={trail.id} className="trail-card-large">
                <div className="trail-card-content">
                  <div className="trail-header">
                    <h3>{trail.name}</h3>
                    <button className="heart-btn">♡</button>
                  </div>
                  <div className="trail-info">
                    <p>Level: {trail.level}</p>
                    <p>Dist: {trail.distance}</p>
                    <p>Time: {trail.time}</p>
                    <button className="share-btn">↗</button>
                  </div>
                  <div className="trail-image">
                    <img src={trail.image} alt={trail.name} />
                  </div>
                  <div className="see-more">
                    <span>See More &gt;</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button 
              className={`tab-button ${activeTab === 'Trails' ? 'active' : ''}`}
              onClick={() => setActiveTab('Trails')}
            >
              Trails
            </button>
            <button 
              className={`tab-button ${activeTab === 'Camps' ? 'active' : ''}`}
              onClick={() => setActiveTab('Camps')}
            >
              Camps
            </button>
            <button 
              className={`tab-button ${activeTab === 'Hikes' ? 'active' : ''}`}
              onClick={() => setActiveTab('Hikes')}
            >
              Hikes
            </button>
          </div>
        </div>
        
        <Link to="/" className="nav-button">
          Back to Map
        </Link>

        <Link to="/map" className="view-map-btn">
            View Map
        </Link>
      </div>
    );
  }

  export default TrailSelectionPage;