import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Map from "./Map";
import Detail from "./Detail";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<Map />} />
        <Route path="/detail/:id" element={<Detail />} />
      </Routes>
    </Router>
  );
}

export default App;
