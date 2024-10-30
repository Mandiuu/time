document.addEventListener('DOMContentLoaded', () => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2FybGFtYW5kaW9sYSIsImEiOiJjbHo2M2x6ZDEybzhoMmpvaWEzemg2bzhyIn0.EorVdgNT0Uj_7ncSDV8NGQ';

    // Function to adjust z-index on mobile for geocoders
    function adjustZIndexForMobile() {
        if (window.innerWidth <= 600) {
            document.querySelectorAll('.mapboxgl-ctrl-geocoder').forEach((geocoderElement, index) => {
                geocoderElement.style.zIndex = 20 - index; // Higher z-index for earlier elements
            });
        }
    }

    // Initialize the geocoder for the first section
    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        types: 'place,locality,neighborhood',
        placeholder: 'Enter city or country',
        language: 'en'
    });

    document.getElementById('search-box-container').appendChild(geocoder.onAdd());
    adjustZIndexForMobile();

    geocoder.on('result', (e) => {
        const placeName = formatPlaceName(e.result.place_name);
        const [longitude, latitude] = e.result.geometry.coordinates;
        addTimeForCity(placeName, latitude, longitude);
    });

    function formatPlaceName(placeName) {
        const parts = placeName.split(', ');
        const city = parts[0];
        const country = parts[parts.length - 1];
        return `${city}, ${country}`;
    }

    // Display the user's local time zone on initial load
    displayUserTimeZone();

    function displayUserTimeZone() {
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const timeZoneCity = userTimeZone.split('/')[1].replace('_', ' ');
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
            const timezoneResponse = await fetch(`https://api.timezonedb.com/v2.1/get-time-zone?key=8NOC511M2LYK&format=json&by=position&lat=${latitude}&lng=${longitude}`);
            const timezoneData = await timezoneResponse.json();

            if (timezoneData.status === "OK") {
                const currentTime = new Date(timezoneData.formatted).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                liElement.textContent = `${cityName}: ${currentTime}`;
            } else {
                liElement.textContent = `${cityName} - Time not available`;
            }
        } catch (error) {
            liElement.textContent = `${cityName} - Time not available`;
        }
    }

    // Second section for time zone comparison
    const geocoder1 = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        types: 'place,locality,neighborhood',
        placeholder: 'Enter city, country',
        language: 'en',
        mapboxgl: mapboxgl
    });

    const geocoder2 = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        types: 'place,locality,neighborhood',
        placeholder: 'Enter city, country',
        language: 'en',
        mapboxgl: mapboxgl
    });

    document.getElementById('geocoder1').appendChild(geocoder1.onAdd());
    document.getElementById('geocoder2').appendChild(geocoder2.onAdd());
    adjustZIndexForMobile();

    let city1 = '';
    let city2 = '';
    let coords1 = null;
    let coords2 = null;

    geocoder1.on('result', (e) => {
        city1 = formatPlaceName(e.result.place_name);
        coords1 = e.result.geometry.coordinates;
    });

    geocoder2.on('result', (e) => {
        city2 = formatPlaceName(e.result.place_name);
        coords2 = e.result.geometry.coordinates;
    });

    const compareButton = document.getElementById('compare-button');
    if (compareButton) {
        compareButton.addEventListener('click', async () => {
            const timeInput = document.getElementById('time-input').value;

            if (!timeInput || !city1 || !city2 || !coords1 || !coords2) {
                document.getElementById('result').textContent = 'Please fill in all fields.';
                return;
            }

            const timeParts = timeInput.split(':');
            let hours = parseInt(timeParts[0], 10);
            const minutes = parseInt(timeParts[1], 10);

            try {
                const [timezone1, timezone2] = await Promise.all([
                    getTimeZoneOffset(coords1[1], coords1[0]),
                    getTimeZoneOffset(coords2[1], coords2[0])
                ]);

                if (!timezone1 || !timezone2) {
                    document.getElementById('result').textContent = 'Could not retrieve time zone information.';
                    return;
                }

                const offsetDifference = timezone2.offset - timezone1.offset;
                const newHours24 = (hours + offsetDifference + 24) % 24;

                const originalHours = hours % 12 || 12;
                const originalPeriod = hours >= 12 ? 'PM' : 'AM';
                const originalTimeFormatted = `${originalHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${originalPeriod}`;

                const newHours = newHours24 % 12 || 12;
                const period = newHours24 >= 12 ? 'PM' : 'AM';
                const timeFormatted = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;

                // Determine if the time shifts to "yesterday" or "tomorrow"
                let dayShift = '';
                if (offsetDifference > 0 && newHours24 < hours) {
                    dayShift = ' (tomorrow)';
                } else if (offsetDifference < 0 && newHours24 > hours) {
                    dayShift = ' (yesterday)';
                }

                document.getElementById('result').textContent = `If it is ${originalTimeFormatted} in ${city1}, it is ${timeFormatted} in ${city2}${dayShift}.`;
            } catch (error) {
                console.error('Error comparing time zones:', error);
                document.getElementById('result').textContent = 'An error occurred while comparing time zones.';
            }
        });
    }

    // Event listener to re-adjust z-index when resizing the window
    window.addEventListener('resize', adjustZIndexForMobile);
});

// Function to get the time zone offset using TimeZoneDB API based on coordinates
async function getTimeZoneOffset(latitude, longitude) {
    try {
        const response = await fetch(`https://api.timezonedb.com/v2.1/get-time-zone?key=8NOC511M2LYK&format=json&by=position&lat=${latitude}&lng=${longitude}`);
        const data = await response.json();

        if (data.status === "OK") {
            return { offset: data.gmtOffset / 3600 };
        } else {
            console.error('TimeZoneDB error:', data.message);
            return null;
        }
    } catch (error) {
        console.error('Error fetching time zone:', error);
        return null;
    }
}
