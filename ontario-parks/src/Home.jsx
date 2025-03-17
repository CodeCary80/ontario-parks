import { useNavigate } from "react-router-dom";
import TrailCard from "./components/TrailCard";
import './App.css';

const trails = [
  { id: 1, name: "Whiskey Rapids Trail", level: "Easy", dist: "17kms", time: "150mins" },
  { id: 2, name: "Big Pine Trail", level: "Moderate", dist: "12kms", time: "120mins" }
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <h2>Hello, Sandy!</h2>
      <h3>Choose your trails</h3>

      <div className="trail-list">
        {trails.map((trail) => (
          <TrailCard key={trail.id} trail={trail} onNavigate={navigate} />
        ))}
      </div>

      <button className="map-btn" onClick={() => navigate("/map")}>View Map</button>
    </div>
  );
}
