import React from "react";
import "./LoadingAnimation.css";

const LoadingAnimation = () => {
  return (
    <div className="loading-container">
      <div className="news-loading-animation">
        <div className="circle-container">
          <div className="circle circle-1"></div>
          <div className="circle circle-2"></div>
          <div className="circle circle-3"></div>
        </div>
        <div className="news-loading-text">
          <h5>AI is analyzing your preferences</h5>
          <p>Finding the most relevant news just for you...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
