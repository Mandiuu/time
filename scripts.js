document.addEventListener('DOMContentLoaded', () => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2FybGFtYW5kaW9sYSIsImEiOiJjbHo2M2x6ZDEybzhoMmpvaWEzemg2bzhyIn0.EorVdgNT0Uj_7ncSDV8NGQ'; // Replace with your valid Mapbox token

    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        types: 'place,locality,neighborhood',
        placeholder: 'Enter city or country',
        language: 'en' // Set the language to English
    });

    document.getElementById('search-box-container').appendChild(geocoder.onAdd());

    geocoder.on('result', (e) => {
        const placeName = formatPlaceName(e.result.place_name);
        const [longitude, latitude] = e.result.geometry.coordinates;
        addTimeForCity(placeName, latitude, longitude);
    });

    function formatPlaceName(placeName) {
        const parts = placeName.split(', ');
        const city = parts[0]; // Get the city name
        const country = parts[parts.length - 1]; // Get the country name
        return `${city}, ${country}`;
    }

    // Display the user's local time zone on initial load
    displayUserTimeZone();
});

// Function to display the user's time zone
function displayUserTimeZone() {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timeZoneCity = userTimeZone.split('/')[1].replace('_', ' '); // Extract city and format it
    const list = document.getElementById('suggestions');
    const li = document.createElement('li');
    const currentTime = new Date().toLocaleTimeString('en-US', { timeZone: userTimeZone });

    li.textContent = `Your Time Zone (${timeZoneCity}): ${currentTime}`;
    list.appendChild(li);
}

// Function to add the selected city's time to the list
function addTimeForCity(cityName, latitude, longitude) {
    const list = document.getElementById('suggestions');
    const li = document.createElement('li');
    li.textContent = `${cityName} - Loading time...`;
    list.appendChild(li);

    // Fetch the local time for the city's coordinates
    fetchTimeForCity(cityName, latitude, longitude, li);
}

// Function to fetch the time based on coordinates using TimeZoneDB or another API
async function fetchTimeForCity(cityName, latitude, longitude, liElement) {
    try {
        // Fetch the time zone information based on the coordinates
        const timezoneResponse = await fetch(`https://api.timezonedb.com/v2.1/get-time-zone?key=8NOC511M2LYK&format=json&by=position&lat=${latitude}&lng=${longitude}`);
        const timezoneData = await timezoneResponse.json();

        if (timezoneData.status === "OK") {
            const currentTime = new Date(timezoneData.formatted).toLocaleTimeString();
            liElement.textContent = `${cityName} (${timezoneData.zoneName.split('/')[1].replace('_', ' ')}): ${currentTime}`;
        } else {
            liElement.textContent = `${cityName} - Time not available`;
        }
    } catch (error) {
        liElement.textContent = `${cityName} - Time not available`;
    }
}
