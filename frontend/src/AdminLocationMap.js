import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import './AdminPage.css';

const BACKEND = "http://localhost:8000";

const userIcon = new L.Icon({
  iconUrl: 'https://static.vecteezy.com/system/resources/thumbnails/019/897/155/small/location-pin-icon-map-pin-place-marker-png.png', // just using this one from the web temporarily
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Custom marker icons for different monster types
const getTypeIcon = (type) => {
  const iconMapping = {
    'F&D': '/images/foodEgg.png',
    'HWB': '/images/healthEgg.png',
    'W': '/images/waterEgg.png',
    'WA': '/images/wasteEgg.png',
    'N&B': '/images/natureEgg.png',
    'E': '/images/natureEgg.png', // Using nature as fallback for energy
    'default': '/images/natureEgg.png'
  };

  const iconUrl = iconMapping[type] || iconMapping.default;

  return new L.Icon({
    iconUrl,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

// LocationMarker component for adding new locations
const AddLocationMarker = ({ position, setPosition }) => {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    // If no initial position, center on Exeter University (default)
    if (!position) {
      map.locate({ setView: true, maxZoom: 16 });
      map.on('locationfound', (e) => {
        setPosition([e.latlng.lat, e.latlng.lng]);
      });
    }
  }, [map, position, setPosition]);

  // Handle marker drag end
  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const newPosition = marker.getLatLng();
        setPosition([newPosition.lat, newPosition.lng]);
      }
    },
  };

  return position ? (
    <Marker
      position={position}
      icon={userIcon}
      draggable={true}
      eventHandlers={eventHandlers}
      ref={markerRef}
    >
      <Popup>
        New location position. <br />
        Drag to adjust.
      </Popup>
    </Marker>
  ) : null;
};

const AdminLocationMap = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [monsters, setMonsters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // New location form state
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocationPosition, setNewLocationPosition] = useState(null);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationType, setNewLocationType] = useState('');
  const [newLocationDescription, setNewLocationDescription] = useState('');
  
  // Delete confirmation state
  const [deletingLocation, setDeletingLocation] = useState(null);

  const defaultPosition = [50.735, -3.533]; // Default center position (Exeter University)

  useEffect(() => {
    checkAdminStatus();
    fetchLocations();
    fetchMonsters();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${BACKEND}/api/user/check-admin/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (!response.ok || !data.is_admin) {
        // If not admin, redirect to home
        navigate('/home');
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      navigate('/home');
    }
  };

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BACKEND}/api/user/admin/locations/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }

      const locationsData = await response.json();
      setLocations(locationsData);
      setLoading(false);
    } catch (err) {
      setError('Error loading locations: ' + err.message);
      setLoading(false);
    }
  };

  const fetchMonsters = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BACKEND}/api/user/admin/monsters/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch monsters');
      }

      const monstersData = await response.json();
      setMonsters(monstersData);
    } catch (err) {
      setError('Error loading monsters: ' + err.message);
    }
  };

  const handleBack = () => {
    navigate('/admin');
  };

  const handleAddLocation = () => {
    setIsAddingLocation(true);
  };

  const handleCancelAddLocation = () => {
    setIsAddingLocation(false);
    setNewLocationPosition(null);
    setNewLocationName('');
    setNewLocationType('');
    setNewLocationDescription('');
  };

  const handleCreateLocation = async () => {
    if (!newLocationPosition || !newLocationName || !newLocationType) {
      setError('Please fill in all required fields');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BACKEND}/api/user/admin/locations/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location_name: newLocationName,
          type: newLocationType,
          latitude: newLocationPosition[0],
          longitude: newLocationPosition[1],
          description: newLocationDescription
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create location');
      }

      const newLocation = await response.json();
      
      // Update locations list
      setLocations([...locations, newLocation]);
      
      // Reset form
      handleCancelAddLocation();
      
      setSuccessMessage('Location created successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Error creating location: ' + err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteLocation = async (locationId) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BACKEND}/api/location/locations/update/${locationId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete location');
      }
      
      // Update locations list
      setLocations(locations.filter(location => location.id !== locationId));
      
      // Reset delete confirmation
      setDeletingLocation(null);
      
      setSuccessMessage('Location deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Error deleting location: ' + err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const getMonsterTypeLabel = (type) => {
    const types = {
      'F&D': 'Food and Drink',
      'HWB': 'Health and Wellbeing',
      'W': 'Water',
      'WA': 'Waste',
      'N&B': 'Nature and Biodiversity',
      'E': 'Energy',
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-content">
          <div className="admin-header">
            <h2 className="admin-title">Loading Location Map...</h2>
            <button className="back-button" onClick={handleBack}>Back to Admin</button>
          </div>
          <div className="loading-message">Loading data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-content">
        <div className="admin-header">
          <h2 className="admin-title">Location Management</h2>
          <button className="back-button" onClick={handleBack}>Back to Admin</button>
        </div>
        
        {/* Messages */}
        {error && (
          <div className="error-message">{error}</div>
        )}
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}
        
        {/* Map Container */}
        <div className="map-section">
          <div className="admin-map-container">
            <MapContainer
              center={defaultPosition}
              zoom={15}
              style={{ width: '100%', height: '500px' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Existing Locations */}
              {locations.map(location => (
                <Marker
                  key={location.id}
                  position={[location.latitude, location.longitude]}
                  icon={getTypeIcon(location.type)}
                >
                  <Popup>
                    <div className="map-popup">
                      <h3>{location.location_name}</h3>
                      <p>Type: {getMonsterTypeLabel(location.type)}</p>
                      {location.description && <p>{location.description}</p>}
                      <button 
                        className="small-btn remove-btn"
                        onClick={() => setDeletingLocation(location)}
                      >
                        Delete Location
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              {/* New Location Marker */}
              {isAddingLocation && (
                <AddLocationMarker 
                  position={newLocationPosition} 
                  setPosition={setNewLocationPosition} 
                />
              )}
            </MapContainer>
          </div>
          
          {/* Action Buttons */}
          <div className="map-actions">
            {!isAddingLocation ? (
              <button className="admin-btn create-btn" onClick={handleAddLocation}>
                Add New Location
              </button>
            ) : (
              <div className="admin-form-section">
                <h3 className="section-title">Add New Location</h3>
                <div className="admin-form">
                  <div className="form-group">
                    <label>Name:</label>
                    <input 
                      type="text" 
                      value={newLocationName} 
                      onChange={(e) => setNewLocationName(e.target.value)}
                      placeholder="Location name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Type:</label>
                    <select 
                      value={newLocationType} 
                      onChange={(e) => setNewLocationType(e.target.value)}
                    >
                      <option value="">Select a type</option>
                      <option value="F&D">Food and Drink</option>
                      <option value="HWB">Health and Wellbeing</option>
                      <option value="W">Water</option>
                      <option value="WA">Waste</option>
                      <option value="N&B">Nature and Biodiversity</option>
                      <option value="E">Energy</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Description:</label>
                    <textarea 
                      value={newLocationDescription} 
                      onChange={(e) => setNewLocationDescription(e.target.value)}
                      placeholder="Description (optional)"
                      rows="3"
                    />
                  </div>
                  <div className="form-group location-info">
                    <label>Location:</label>
                    {newLocationPosition ? (
                      <span>
                        Lat: {newLocationPosition[0].toFixed(6)}, 
                        Lng: {newLocationPosition[1].toFixed(6)}
                      </span>
                    ) : (
                      <span>Click on the map to set location</span>
                    )}
                  </div>
                  <div className="form-actions">
                    <button className="admin-btn create-btn" onClick={handleCreateLocation}>
                      Create Location
                    </button>
                    <button className="admin-btn cancel-btn" onClick={handleCancelAddLocation}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Delete Confirmation Dialog */}
        {deletingLocation && (
          <div className="modal-overlay">
            <div className="confirmation-modal">
              <h3>Delete Location</h3>
              <p>Are you sure you want to delete the location "{deletingLocation.location_name}"?</p>
              <div className="modal-actions">
                <button 
                  className="admin-btn remove-btn" 
                  onClick={() => handleDeleteLocation(deletingLocation.id)}
                >
                  Delete
                </button>
                <button 
                  className="admin-btn cancel-btn" 
                  onClick={() => setDeletingLocation(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLocationMap;
