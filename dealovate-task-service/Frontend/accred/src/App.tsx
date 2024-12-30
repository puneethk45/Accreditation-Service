import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import SuccessPage from "./SuccessPage.tsx";
import AccreddEmbed from "./AccreddEmbed.tsx";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/" element={<AccreddEmbed />} />
      </Routes>
    </Router>
  );
};

export default App;