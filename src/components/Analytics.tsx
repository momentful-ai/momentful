import { useEffect } from "react";
import ReactGA from "react-ga4";

// Get the tracking ID from Vite's environment variables
const trackingId = import.meta.env.GOOGLE_ANALYTICS_ID;

export default function AnalyticsInitializer() {
  useEffect(() => {
    // We use useEffect with an empty dependency array []
    // to ensure this code runs only once after the component mounts.
    if (trackingId) {
      // 1. Initialize GA
      ReactGA.initialize(trackingId);
      console.log("Google Analytics Initialized with ID:", trackingId);

      // 2. Explicitly send the initial pageview for the single page
      ReactGA.send({
        hitType: "pageview",
        page: window.location.pathname + window.location.search,
        title: document.title,
      });
      console.log("Initial Pageview Sent.");
    } else {
      console.warn(
        "Google Analytics Tracking ID is missing. Check your .env file."
      );
    }
  }, []); // Runs only once

  // The component doesn't render any visible elements
  return null;
}
