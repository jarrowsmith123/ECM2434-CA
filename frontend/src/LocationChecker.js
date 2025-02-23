import {useEffect, useState} from 'react';

const LocationChecker = () =>{
    const [message, sestMessage] = useState('');

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    
                    fetch("http://192.168.0.14:3000/api/check-location/", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ latitude, longitude }),
                    })
                        .then(response => response.json())
                        .then(data => setLocationMessage(data.message))
                        .catch(error => console.error("Error: ", error));
                    },
                    (error) => {
                        console.error("Error getting location", error);
                        setLocationMessage("Error getting location.");
                    }
                );
        } else {
            setLocationMessage("Geolocation is not supported.");
        }
    }, []);

    return (
        <div>
            <h1>Location Checker</h1>
            <p>{locationMessage}</p>
        </div>
    );
};

export default LocationChecker;