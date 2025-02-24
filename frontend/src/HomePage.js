import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup, Circle } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './HomePage.css';

const userIcon = new L.Icon({
  iconUrl: 'https://static.vecteezy.com/system/resources/thumbnails/019/897/155/small/location-pin-icon-map-pin-place-marker-png.png', // just using this one from the web temporarily
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// The information about all the monsters

// At a later date this shoudl prbably all be added into another file which can be
// shared across all of the javascript but i havent done that right now

const monsterIcons = {
  'F&D': new L.Icon({
    iconUrl: '/images/Food_Monster.png',
    iconSize: [50, 50],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  }),
  'H': new L.Icon({
    iconUrl: '/images/Nature_Monster.png',
    iconSize: [50, 50],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  }),
  'WB': new L.Icon({
    iconUrl: '/images/Gym_Monster.png',
    iconSize: [50, 50],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  }),
  'W': new L.Icon({
    iconUrl: '/images/Nature_Monster.png',
    iconSize: [50, 50],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  }),
  'WA': new L.Icon({
    iconUrl: '/images/Electricity_Monster.png',
    iconSize: [50, 50],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  }),
  'N&B': new L.Icon({
    iconUrl: '/images/Nature_Monster.png',
    iconSize: [50, 50],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  }),
  'T': new L.Icon({
    iconUrl: '/images/Gym_Monster.png',
    iconSize: [50, 50],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  }),
  // Default icon if type doesn't match
  'default': new L.Icon({
    iconUrl: '/images/Nature_Monster.png',
    iconSize: [50, 50],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  })
};

// just come mock data while the backend doesnt support it
const mockMonsters = [
  {
    id: 1,
    name: "WaterWizard",
    type: "W",
    rarity: "C",
    latitude: 50.736,
    longitude: -3.532,
    collectible: true
  },
  {
    id: 2,
    name: "RecycleBeast",
    type: "WA",
    rarity: "R",
    latitude: 50.734,
    longitude: -3.535,
    collectible: true
  },
  {
    id: 3,
    name: "NatureGuardian",
    type: "N&B",
    rarity: "E",
    latitude: 50.733,
    longitude: -3.530,
    collectible: true
  },
  {
    id: 4,
    name: "GymGremlin",
    type: "T",
    rarity: "L",
    latitude: 50.737,
    longitude: -3.536,
    collectible: true
  },
  {
    id: 5,
    name: "FoodFiend",
    type: "F&D",
    rarity: "C",
    latitude: 50.738,
    longitude: -3.531,
    collectible: true
  },
  {
    id: 6,
    name: "HealthHero",
    type: "H",
    rarity: "R",
    latitude: 50.735,
    longitude: -3.529,
    collectible: true
  },
  {
    id: 7,
    name: "ZenMonster",
    type: "WB",
    rarity: "E",
    latitude: 50.732,
    longitude: -3.534,
    collectible: true
  }
];

const getRarityColor = (rarity) => {
  switch(rarity) { // can change these colours later just liked them from now
    case 'C': return '#a5a5a5'; // Common - Gray
    case 'R': return '#3498db'; // Rare - Blue
    case 'E': return '#9b59b6'; // Epic - Purple
    case 'L': return '#f1c40f'; // Legendary - Gold
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

// Same again
const getTypeName = (type) => {
  switch(type) {
    case 'F&D': return 'Food and Drink';
    case 'H': return 'Health';
    case 'WB': return 'Wellbeing';
    case 'W': return 'Water';
    case 'WA': return 'Waste';
    case 'N&B': return 'Nature and Biodiversity';
    case 'T': return 'Transport';
    default: return 'Unknown';
  }
};

const LocationMarker = ({ setUserPosition }) => {
  const [position, setPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const map = useMap();

  // Im not sure if i like the way this works at teh momement but it will do for now.  becuse it will recentre around the point you are at which can be slightly annoying i think that it probably should only do that if you are still cnetred around the point where you arr or if you press a button to recentre it.
  useEffect(() => {
    map.locate({
      watch: true, // Keep tracking location
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 10000
    });

    // Event handlers for location updates
    map.on('locationfound', handleLocationFound);
    map.on('locationerror', handleLocationError);

    return () => {
      // Clean up event listeners when component unmounts
      map.stopLocate();
      map.off('locationfound', handleLocationFound);
      map.off('locationerror', handleLocationError);
    };
  }, [map]);

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

  return position === null ? null : (
    <>
      <Marker position={position} icon={userIcon} />
      <Circle center={position} radius={accuracy} />
    </>
  );
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
  const [monsters, setMonsters] = useState(mockMonsters);
  const [selectedMonster, setSelectedMonster] = useState(null);
  
  // Check for initial user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPosition([
            position.coords.latitude,
            position.coords.longitude
          ]);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  // Update canCollect state based on user position and nearby monsters
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

  const handleChallengesClick = () => {
      // We arent doing challenges anymore
    //navigate('/challenges');
  };

  const handleCollect = () => {
    if (selectedMonster && canCollect) {
        // Need to implement that backend for this but i thnk this is alright for now because you shouldnt be able to collect a monster twice.
      
      setMonsters(prevMonsters =>
        prevMonsters.map(monster =>
          monster.id === selectedMonster.id
            ? { ...monster, collectible: false }
            : monster
        )
      );
      setCanCollect(false);
    }
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

  // Dont need to track the map being moved any more because i did it a different way so ive removed this
    
  return (
    <div className="map-container">
      <MapContainer
        center={userPosition || defaultPosition}
        zoom={16}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker setUserPosition={setUserPosition} />
        <MonsterMarkers
          monsters={monsters}
          userPosition={userPosition}
          onMonsterClick={handleMonsterClick}
        />
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
          
      <button
          className="nav-button collect-button" // This is a really jammy fix but it works
        onClick={handleCollect}
        disabled={!canCollect}
      >
        {canCollect && selectedMonster
          ? `Collect ${selectedMonster.name}`
          : "No monsters nearby"}
      </button>
    </div>
  );
};

export default HomePage;
