// SELECT HTML ELEMENTS IN THE DOCUMENT
const myTown = document.querySelector('#town');
const myDecription = document.querySelector('#description');
const myTemperatureImperial = document.querySelector('#temperatureImperial');
const myTemperatureMetric = document.querySelector('#temperatureMetric');
const myGraphic = document.querySelector('#graphic');
const currentTemp = document.querySelector('#current-temp');

// CREATE REQUIED VARIABLES FOR THE URL
const myKey ="40892fcd23eff123bc5dec810bc513b6"
const myLat = "-48.876667"
const myLong = "-123.393333"

//CONSTRUCT A FULL PATH USING TEMPLATE LITERALS
const myURLimperial = `https://api.openweathermap.org/data/2.5/weather?lat=${myLat}&lon=${myLong}&appid=${myKey}&units=imperial`
const myURLMetric = `https://api.openweathermap.org/data/2.5/weather?lat=${myLat}&lon=${myLong}&appid=${myKey}&units=metric`

// TRY TO GRAB THE CURRENT WEATHER DATA
async function apiFetch() {
  try {
    const responseI = await fetch(myURLimperial);
    if (responseI.ok) {
      const dataI = await responseI.json();
    //   console.log(dataI); // testing only
      displayResultsImperial(dataI); // uncomment when ready
    } else {
      throw new Error(await responseI.text());
    }
    
    const responseM = await fetch(myURLMetric);
    if (responseM.ok) {
      const dataM = await responseM.json();
    //   console.log(dataM); // testing only
      displayResultsMetric(dataM); // uncomment when ready
    } else {
      throw new Error(await responseM.text());
    }
  } catch (error) {
    console.error(error);
  }
}

// DISPLAY THE JSON DATA ONTO MY WEB PAGE
function displayResultsImperial(dataI) {
  temp = `${dataI.main.temp}&deg;F`;
  myTemperatureImperial.innerHTML = temp;
  currentTemp.innerHTML = temp;
  const iconsrc = `https://openweathermap.org/img/wn/${dataI.weather[0].icon}@2x.png`;
  const desc = dataI.weather[0].description;
  myGraphic.setAttribute('src', iconsrc);
  myGraphic.setAttribute('alt', `${dataI.weather[0].main} icon`);
  myDecription.textContent = desc;
}
function displayResultsMetric(dataM) {
  temp = `${dataM.main.temp}&deg;C`;
  myTemperatureMetric.innerHTML = temp;
  currentTemp.innerHTML += ` or ${temp}`;
}

apiFetch();