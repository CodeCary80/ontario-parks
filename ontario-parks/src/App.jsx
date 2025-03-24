// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import MapPage from './pages/mapPage.jsx';
import TrailSelectionPage from './pages/TrailSelectionPage.jsx';
import TrailDetailsPage from './pages/TrailDetailsPage.jsx';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<TrailSelectionPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/trail/:id" element={<TrailDetailsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;