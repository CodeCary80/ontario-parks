import { useParams, useNavigate } from "react-router-dom";

const trailData = {
  1: { name: "Whiskey Rapids Trail", description: "A beautiful trail along the river." },
  2: { name: "Big Pine Trail", description: "Scenic route through the forest." }
};

export default function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const trail = trailData[id];

  return (
    <div className="container">
      <h2>{trail.name}</h2>
      <p>{trail.description}</p>
      <button onClick={() => navigate("/")}>Back to Home</button>
    </div>
  );
}
