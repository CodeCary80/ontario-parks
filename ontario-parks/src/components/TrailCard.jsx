export default function TrailCard({ trail, onNavigate }) {
    return (
      <div className="trail-card">
        <h4>{trail.name}</h4>
        <p>Level: {trail.level}</p>
        <p>Distance: {trail.dist}</p>
        <p>Time: {trail.time}</p>
  
        <button onClick={() => onNavigate(`/detail/${trail.id}`)}>See More</button>
        <button onClick={() => onNavigate("/map")}>📍 Map</button>
      </div>
    );
  }
  