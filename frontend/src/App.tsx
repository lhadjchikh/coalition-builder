import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import '@shared/styles/content-animations.css';
import '@shared/styles/campaign-animations.css';
import Home from './pages/Home';
import About from './pages/About';
import Campaigns from './pages/Campaigns';
import Contact from './pages/Contact';
import CampaignDetail from './pages/CampaignDetail';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import GoogleAnalytics from './components/GoogleAnalytics';
import CookieConsent from '@shared/components/CookieConsent';
import { ThemeProvider } from './contexts/ThemeContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
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
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
