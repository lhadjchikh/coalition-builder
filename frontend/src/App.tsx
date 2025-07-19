import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import '@shared/styles/content-animations.css';
import Home from './pages/Home';
import About from './pages/About';
import Campaigns from './pages/Campaigns';
import Contact from './pages/Contact';
import CampaignDetail from './pages/CampaignDetail';
import GoogleAnalytics from './components/GoogleAnalytics';
import CookieConsent from '@shared/components/CookieConsent';

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <GoogleAnalytics />
        <CookieConsent />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaigns/:name" element={<CampaignDetail />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
