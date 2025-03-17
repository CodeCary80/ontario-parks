import { useNavigate } from "react-router-dom";

export default function Map() {
  const navigate = useNavigate();
  return (
    <div className="container">
      <h2>Map Page</h2>
      <p>Displaying recommended parks/trails...</p>
      <button onClick={() => navigate("/")}>Back to Home</button>
    </div>
  );
}
