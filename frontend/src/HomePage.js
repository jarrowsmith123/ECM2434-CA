import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './HomePage.css';

const HomePage = () => {
  const [canCollect, setCanCollect] = useState(true);
  const defaultPosition = [50.726, 3.537];
  
  const handleMonstersClick = () => {
      
  };

  const handleChallengesClick = () => {
    
  };

  const handleCollect = () => {
      
  };

  // This need to have the logic for if a loot box location is near enough to the users current locationthen the canCollect is set to true
    
  // then this map events is for when dreagging the map around so it needs to move the ui elements which are overlayed
  const MapEvents = () => {
    const map = useMap();
    
    useEffect(() => {
      map.on('moveend', () => {
         
      });
      
      return () => {
        map.off('moveend');
      };
    }, [map]);

    return null;
  };

  return (
    <div className="map-container">
      <MapContainer
        center={defaultPosition}
        zoom={13}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents />
      </MapContainer>
      
      <button
        className="nav-button monsters-button"
        onClick={handleMonstersClick}
      >
        Monsters
      </button>
      
      <button
        className="nav-button challenges-button"
        onClick={handleChallengesClick}
      >
        Challenges
      </button>
      
      {canCollect && (
        <button
          className="collect-button"
          onClick={handleCollect}
        >
          Collect
        </button>
      )}
    </div>
  );
};

export default HomePage;
