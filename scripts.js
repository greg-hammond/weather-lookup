

const settings = {
    username: "",               // geonames account username
    windyThreshold: 15,         // >15 mph === windy
    coldThreshold: 34,          // <34 F === cold
    hotThreshold: 83            // >83 F === hot
};

let zipField = null;
let getWxButton = null;


//-------------------------------------------------------------------------
// get weather - user clicked button or hit enter after entering zip code
//
const getWeather = async () => {

    if (!getUsername()) return;


    const zip = zipField.value;  

    if (zip) {
   
        // show the wait spinner, hide results
        classIf(false, "spinner", "hidden");
        classIf(true, "results", "hidden");

        // call first api to get location coords lat/lng
        const locData = await getLocData(zip);    
    
        if (locData) {

            // call second api to fetch weather for given location
            const wx = await getWeatherForCoords(locData.lat, locData.lng);    

            // populate our results div with data and make it visible
            updateDisplay(locData, wx);
            classIf(false, "results", "hidden");

            // after finished, clear zip field to simplify next lookup
            zipField.value = ""; 

        } else {
            alert("Invalid zip code - please try again.");
        }

        // hide the spinner
        classIf(true, "spinner", "hidden");
    }
}


//-------------------------------------------------------------------------
// make geonames api call to retrieve location data for given zip code
//
const getLocData = async (zip) => {

    // search params required by the zip code lookup api
    const params = {
        "postalcode": zip,
        "country": "US",
        "username": settings.username
    };

    const srchParams = new URLSearchParams(params);
    const URL = "https://api.geonames.org/postalCodeSearchJSON?" + srchParams.toString();

    const resp = await fetch(URL);
    const json = await resp.json();

    return json.postalCodes[0];

}



//-------------------------------------------------------------------------
//  make geonames api call to retrieve weather data for given lat/lng coordinates
//
const getWeatherForCoords = async (lat, lng) => {

    // search params
    const params = {
        "lat": lat,
        "lng": lng,
        "username": settings.username
    };

    const paramStr = new URLSearchParams(params);
    const URL = "https://api.geonames.org/findNearByWeatherJSON?" + paramStr.toString();

    const resp = await fetch(URL)
    const json = await resp.json();
    
    return json.weatherObservation;     // return observation data object

}


//-------------------------------------------------------------------------
//  populate results div with data obtained from api calls
//
const updateDisplay = (loc, wx) => {

    // header data - city/state/zip
    setField("headline", `Current Weather for ${loc.placeName}, ${loc.adminCode1}  ${loc.postalCode}`);

    // temperature data
    const tempF = getFahrenheitFromCelsius(wx.temperature);
    setField("temp", `${tempF}° F`);
    classIf(tempF < settings.hotThreshold, "hot", "nodisplay");
    classIf(tempF > settings.coldThreshold, "cold", "nodisplay");


    // wind speed and direction
    setField("windSpeed", `${+wx.windSpeed} mph`);
    classIf(wx.windSpeed <= settings.windyThreshold, "windy", "nodisplay");

    // rotate arrow icon to indicate actual wind direction == cool
    document.querySelector("#windArrow").style.setProperty("--wind-dir", `${wx.windDirection}deg`);

    // additional observations
    setField("cloudObs", `${wx.clouds}`);
    setField("humidity", `${wx.humidity}%`);
    setField("dewPoint", `${getFahrenheitFromCelsius(wx.dewPoint)}° F`);

    // date/time/station metadata
    setField("dataSource",`Reported at ${wx.datetime} (GMT) from ${wx.stationName}`);

}


//-------------------------------------------------------------------------
//  convert celsius to fahrenheit
//
const getFahrenheitFromCelsius = cTemp => Math.round(cTemp * 1.8 + 32);



//-------------------------------------------------------------------------
// helper - set element value
//
const setField = (id, value) => {
    const elem = document.getElementById(id);
    if (elem) {
        elem.textContent = value;
    }    
}



//-------------------------------------------------------------------------
// helper - add/remove class to element based on condition
//
const classIf = (condition, elemId, addClass) => {
    const elem = document.getElementById(elemId);
    if (elem) {
        const list = elem.classList;
        (condition) ? list.add(addClass) : list.remove(addClass);
    }
}


// prompt for geonames login user before calling apis
const getUsername = () => {
    if (settings.username.length == 0) {
        settings.username = prompt("user login: ");
    }
    return settings.username.length > 0;
}


//-------------------------------------------------------------------------
// init - called by window.onload
//
const init = () => {

    const KEY_ENTER = 13;
    zipField = document.getElementById("zipCode");
    getWxButton = document.getElementById("getWx");    

    getWxButton.addEventListener("click", getWeather);

    // allow enter keypress to act as getWxButton click
    document.body.addEventListener("keyup", evt => {        

        if (evt.keyCode === KEY_ENTER) {
            getWxButton.click();
        }
    })

    // init focus to zip entry field
    zipField.focus();

}


window.onload = init;
