import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef, useState } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import './Colours.css';
import './HomePage.css';
import MonsterCollectionPopup from './MonsterCollectionPopup';
import config from './config';

const userIcon = new L.Icon({
  iconUrl: 'https://static.vecteezy.com/system/resources/thumbnails/019/897/155/small/location-pin-icon-map-pin-place-marker-png.png', // just using this one from the web temporarily
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// The information about all the monsters

// At a later date this should probably all be added into another file which can be
// shared across all of the javascript but i havent done that right now

const monsterIcons = {
  'F&D': new L.Icon({
    iconUrl: '/images/foodEgg.png',
    iconSize: [50, 50],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  }),
  'HWB': new L.Icon({
    iconUrl: '/images/healthEgg.png',
    iconSize: [50, 50],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  }),
  'W': new L.Icon({
    iconUrl: '/images/waterEgg.png',
    iconSize: [50, 50],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  }),
  'WA': new L.Icon({
    iconUrl: '/images/wasteEgg.png',
    iconSize: [50, 50],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  }),
  'N&B': new L.Icon({
    iconUrl: '/images/natureEgg.png',
    iconSize: [50, 50],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  }),
  'T': new L.Icon({
    iconUrl: '/images/transportEgg.png',
    iconSize: [50, 50],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  }),
  'default': new L.Icon({
    iconUrl: '/images/natureEgg.png',
    iconSize: [50, 50],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  })
};

const BACKEND = config.API_URL;

const getRarityColor = (rarity) => {
  switch(rarity) { // can change these colours later just liked them from now
    case 'C': return '#a5a5a5';
    case 'R': return '#3498db';
    case 'E': return '#9b59b6';
    case 'L': return '#f1c40f';
    default: return '#a5a5a5';
  }
};

// This needs to be changed in the backed so that they just have the full name instead of the code because they are currently being stored as tuples which is stupid
const getRarityName = (rarity) => {
  switch(rarity) {
    case 'C': return 'Common';
    case 'R': return 'Rare';
    case 'E': return 'Epic';
    case 'L': return 'Legendary';
    default: return 'Unknown';
  }
};

const getTypeName = (type) => {
  switch(type) {
    case 'F&D': return 'Food and Drink';
    case 'HWB': return 'Health and Wellbeing';
    case 'W': return 'Water';
    case 'WA': return 'Waste';
    case 'N&B': return 'Nature and Biodiversity';
    case 'T': return 'Transport';
    default: return 'Unknown';
  }
};

// Modified LocationMarker to support both auto and manual modes
const LocationMarker = ({ setUserPosition, isManualMode, manualPosition, setManualPosition }) => {
  const [position, setPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const map = useMap();
  const markerRef = useRef(null);

  // Im not sure if i like the way this works at teh momement but it will do for now.  becuse it will recentre around the point you are at which can be slightly annoying i think that it probably should only do that if you are still cnetred around the point where you arr or if you press a button to recentre it.
  useEffect(() => {
    if (!isManualMode) {
      map.locate({
        watch: true,
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000
      });

      // Event handlers for location updates
      map.on('locationfound', handleLocationFound);
      map.on('locationerror', handleLocationError);

      return () => {
        // Clean up event listeners when component unmounts or mode changes
        map.stopLocate();
        map.off('locationfound', handleLocationFound);
        map.off('locationerror', handleLocationError);
      };
    }
  }, [map, isManualMode]);

  // Handle successful location updates
  const handleLocationFound = (e) => {
    const newPosition = e.latlng;
    setPosition(newPosition);
    setAccuracy(e.accuracy);
    
    setUserPosition([newPosition.lat, newPosition.lng]);
    
    // Center map on user's location when first found
    if (position === null) {
      map.flyTo(newPosition, map.getZoom());
    }
  };

  // Handle location errors
  const handleLocationError = (e) => {
    console.error('Location error:', e.message);
    setLocationError(e.message);
  };

  // For draggable marker in manual mode
  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const newPosition = marker.getLatLng();
        setManualPosition([newPosition.lat, newPosition.lng]);
        setUserPosition([newPosition.lat, newPosition.lng]);
      }
    },
  };

  // Show the marker based on the current mode
  if (isManualMode) {
    return manualPosition ? (
      <Marker
        position={manualPosition}
        icon={userIcon}
        draggable={true}
        ref={markerRef}
        eventHandlers={eventHandlers}
      />
    ) : null;
  } else {
    return position === null ? null : (
      <>
        <Marker position={position} icon={userIcon} />
        <Circle center={position} radius={accuracy} />
      </>
    );
  }
};

const MonsterMarkers = ({ monsters, userPosition, onMonsterClick }) => {
  return (
    <>
      {monsters.map(monster => {
        const position = [monster.latitude, monster.longitude];
        const monsterIcon = monsterIcons[monster.type] || monsterIcons.default;
        
        // Calculate distance to user if user position is known
        let distance = null;
        if (userPosition) {
          // Use haversine because it techincally calcualating the distance between 2 points on a globe and this is easier when using the longitude and latitude even though the distance wont be affected by the curvature of the earth
          const earth_radius = 6371e3; // Earth radius in meters
          const angle_1 = userPosition[0] * Math.PI/180;
          const angle_2 = monster.latitude * Math.PI/180;
          const delta_1 = (monster.latitude - userPosition[0]) * Math.PI/180;
          const delta_2 = (monster.longitude - userPosition[1]) * Math.PI/180;
            
          const sin_delta_1 = Math.sin(delta_1 / 2);
          const sin_delta_2 = Math.sin(delta_2 / 2);
            
          const a = sin_delta_1 * sin_delta_1 +
                    Math.cos(angle_1) * Math.cos(angle_2) *
                    sin_delta_2 * sin_delta_2;
            
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          distance = earth_radius * c;
        }
        
        return (
          <Marker
            key={monster.id}
            position={position}
            icon={monsterIcon}
            eventHandlers={{
              click: () => onMonsterClick(monster)
            }}
          >
            <Popup>
              <div style={{
                borderLeft: `4px solid ${getRarityColor(monster.rarity)}`,
                paddingLeft: '10px'
              }}>
                <h3>{monster.name}</h3>
                <p>Type: {getTypeName(monster.type)}</p>
                <p>Rarity: {getRarityName(monster.rarity)}</p>
                {distance !== null && (
                  <p>Distance: {Math.round(distance)} meters</p>
                )}
                {monster.collectible && distance !== null && distance < 100 && (
                  <button onClick={(e) => {
                    e.stopPropagation();
                    onMonsterClick(monster);
                  }}>
                    Collect
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const [canCollect, setCanCollect] = useState(false);
  const defaultPosition = [50.735, -3.533]; // Default center position which is just exeter uni basically
  const [userPosition, setUserPosition] = useState(null);
  const [manualPosition, setManualPosition] = useState(null);
  const [monsters, setMonsters] = useState([]);
  const [selectedMonster, setSelectedMonster] = useState(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [showCollectionPopup, setShowCollectionPopup] = useState(false);
  const [collectedMonster, setCollectedMonster] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Get locations from the backend
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        const response = await fetch(`${BACKEND}/api/location/locations/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch locations');
        }
        
        const locationData = await response.json();
        // Map the locations to include collectible status
        const mappedMonsters = locationData.map(location => ({
          ...location,
          collectible: true // Assume all are collectible initially
        }));
        
        setMonsters(mappedMonsters);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching locations:', error);
        setLoading(false);
      }
    };
    
    fetchLocations();
  }, []);
  
  // Check for initial user location
  useEffect(() => {
    if (navigator.geolocation && !isManualMode) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = [
            position.coords.latitude,
            position.coords.longitude
          ];
          setUserPosition(pos);
          setManualPosition(pos); // Initialize manual position with current location
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  // Update can Collect state based on user position and nearby monsters
  useEffect(() => {
    if (userPosition) {
      // Check if any monster is within collection range which is currently 100m but probably should make this an environment variable or something so its easier to fiddle with
      const nearbyMonster = monsters.find(monster => {
        const earth_radius = 6371e3; // Earth radius in meters
        const angle_1 = userPosition[0] * Math.PI/180;
        const angle_2 = monster.latitude * Math.PI/180;
        const delta_1 = (monster.latitude - userPosition[0]) * Math.PI/180;
        const delta_2 = (monster.longitude - userPosition[1]) * Math.PI/180;
        
        const sin_delta_1 = Math.sin(delta_1 / 2);
        const sin_delta_2 = Math.sin(delta_2 / 2);
        
        const a = sin_delta_1 * sin_delta_1 +
                Math.cos(angle_1) * Math.cos(angle_2) *
                sin_delta_2 * sin_delta_2;
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = earth_radius * c;
        
        return distance < 100 && monster.collectible; // Within 100 meters
      });
      
      setCanCollect(!!nearbyMonster);
      if (nearbyMonster) {
        setSelectedMonster(nearbyMonster);
      }
    }
  }, [userPosition, monsters]);

  const handleMonstersClick = () => {
    navigate('/monsters');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };
  
  const handleFriendsClick = () => {
    navigate('/friends');
  };

  const handleCollect = () => {
      if (selectedMonster && canCollect) {

      setCollectedMonster(selectedMonster);
      setShowCollectionPopup(true);
      }
  };
    
  const handleClosePopup = () => {
      setShowCollectionPopup(false);
  };
    
  const handleMonsterCollected = (collectedMonster) => {
      setMonsters(prevMonsters =>
      prevMonsters.map(monster =>
          monster.id === selectedMonster.id
          ? { ...monster, collectible: false }
          : monster
      )
      );
      
      setCanCollect(false);
      
      setTimeout(() => {
      setShowCollectionPopup(false);
      }, 3000);
  };

  const handleMonsterClick = (monster) => {
    setSelectedMonster(monster);
      
    // If monster is in range, enable collection
    if (userPosition) {
      // Calculate distance to monster
      const earth_radius = 6371e3; // Earth radius in meters
      const angle_1 = userPosition[0] * Math.PI/180;
      const angle_2 = monster.latitude * Math.PI/180;
      const delta_1 = (monster.latitude - userPosition[0]) * Math.PI/180;
      const delta_2 = (monster.longitude - userPosition[1]) * Math.PI/180;
      
      const sin_delta_1 = Math.sin(delta_1 / 2);
      const sin_delta_2 = Math.sin(delta_2 / 2);
      
      const a = sin_delta_1 * sin_delta_1 +
              Math.cos(angle_1) * Math.cos(angle_2) *
              sin_delta_2 * sin_delta_2;
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = earth_radius * c;
      
      setCanCollect(distance < 100 && monster.collectible);
    }
  };

  // Toggle between manual and automatic location modes
  const toggleLocationMode = () => {
    if (!isManualMode && userPosition) {
      // Switching to manual mode - initialize manual position with current location
      setManualPosition(userPosition);
    }
    setIsManualMode(!isManualMode);
  };
    
  return (
    <div className="map-container">
      <img src="/images/textLogo.png" alt="Logo" className="homePageLogo" />

      <MapContainer
        center={userPosition || defaultPosition}
        zoom={16}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker
          setUserPosition={setUserPosition}
          isManualMode={isManualMode}
          manualPosition={manualPosition}
          setManualPosition={setManualPosition}
        />
        {!loading && (
          <MonsterMarkers
            monsters={monsters}
            userPosition={userPosition}
            onMonsterClick={handleMonsterClick}
          />
        )}
      </MapContainer>
      
      <button
        className="nav-button monsters-button"
        onClick={handleMonstersClick}
      >
        Monsters
      </button>
      
      <button
        className="nav-button profile-button"
        onClick={handleProfileClick}
      >
        Profile
      </button>
      
      <button
        className="nav-button friends-button"
        onClick={handleFriendsClick}
      >
        Friends
      </button>
          
      <button
        className="nav-button collect-button"  // This is a really jammy fix but it works
        onClick={handleCollect}
        disabled={!canCollect}
      >
        {canCollect && selectedMonster
          ? `Collect ${getTypeName(selectedMonster.type)} Monster`
          : "No monsters nearby"}
      </button>

      {/* Toggle button for location mode */}
      <button
        className="nav-button location-mode-button"
        onClick={toggleLocationMode}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          backgroundColor: isManualMode ? '#d0eff7' : '#d0eff7',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        {isManualMode ? '📍' : '🔄'}
      </button>

      {/* Monster Collection Popup */}
      {showCollectionPopup && collectedMonster && (
        <MonsterCollectionPopup
          monster={collectedMonster}
          onClose={handleClosePopup}
          onCollect={handleMonsterCollected}
        />
      )}
    </div>
  );
};

export default HomePage;
