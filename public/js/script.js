function getFlagImage(countryCode) {
  const flagMap = {
    USA: './public/img/countries/USA.webp',
    KAZ: './public/img/countries/KAZ.webp',
    RUS: './public/img/countries/RUS.webp',
    CHN: './public/img/countries/CHN.webp',
    NZL: './public/img/countries/NZL.webp',
    JAP: './public/img/countries/JAP.webp',
    ESP: './public/img/countries/ESP.webp',
    GUF: './public/img/countries/GUF.webp',
    IND: './public/img/countries/IND.webp'
  };
  return flagMap[countryCode] || countryCode;
}

function getStatusAbbreviation(status) {
  const statusMap = {
    "To Be Confirmed": "DO POTWIERDZENIA",
    "Go for Launch": "DATA POTWIERDZONA",
    "To Be Determined": "DO USTALENIA",
    "Launch Successful": "SUKCES",
    "Launch Failure": "PORAŻKA"
  };

  return statusMap[status] || status;
}

function translateLaunch(locationName) {
  const launchPoprawka = {
    "Air launch to Suborbital flight": "Start odbędzie się w powietrzu"
  };
  return launchPoprawka[locationName] || locationName;
}

function fetchData() {
  const cachedData = localStorage.getItem("cachedData");
  const cachedTimestamp = localStorage.getItem("cachedTimestamp");

  if (cachedData) {
    const parsedData = JSON.parse(cachedData);
    const currentTime = new Date().getTime();

    if (currentTime - cachedTimestamp <= 15 * 60 * 1000) {
      displayLaunchData(parsedData.results);
      return;
    }
  }

  const url = "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=10";

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      localStorage.setItem("cachedData", JSON.stringify(data));
      localStorage.setItem("cachedTimestamp", new Date().getTime());

      displayLaunchData(data.results);
    });
}

function displayLaunchData(results) {
  const appDiv = document.getElementById("app");

  appDiv.innerHTML = "";

  results.sort((a, b) => new Date(a.net) - new Date(b.net));

  results.forEach((result) => {
    if (result.mission) {
      const launchElement = document.createElement("article");
      launchElement.className = "start";

      const rocketName = result.rocket.configuration.name;

      const missionName = result.mission.name.replace(/\(([^)]+)\)/g, '');

      const rocketNameElement = document.createElement("p");
      rocketNameElement.textContent = `${rocketName}`;
      rocketNameElement.className = "nazwaRakiety";

      const missionNameElement = document.createElement("p");
      missionNameElement.textContent = `${missionName}`;

      const status = getStatusAbbreviation(result.status.name);
      const statusElement = document.createElement("p");
      statusElement.textContent = `${status}`;
      statusElement.className = "status";

      if (status === "SUKCES") {
        statusElement.className = "udany";
      } if (status === "PORAŻKA") {
        statusElement.className = "nieUdany";
      }

      const countryCode = result.pad.location.country_code;
      const flagImage = getFlagImage(countryCode);
      
      const locationName = translateLaunch(result.pad.location.name.split(",")[0]);
      const locationElement = document.createElement("p");
      locationElement.innerHTML = `${locationName} <img src="${flagImage}" alt="${countryCode}">`; 
      locationElement.className = "lokalizacja";

      const countdownElement = document.createElement("div");
      countdownElement.id = `countdown-${result.id}`;

      if (result.image) {
        const imageElement = document.createElement("img");
        imageElement.className = "obrazek";
        imageElement.src = result.image;
        imageElement.alt = `${rocketName} z misją ${missionName}`;
        launchElement.appendChild(imageElement);
      } else {
        const imageElement = document.createElement("img");
        imageElement.className = "obrazek";
        imageElement.src = `./public/img/brak.png`;
        imageElement.alt = `ni ma obrazka :(`;
        launchElement.appendChild(imageElement);
      }

      const headSectionElement = document.createElement("div");
      headSectionElement.className = `headSection`;
      launchElement.appendChild(headSectionElement);

      
      headSectionElement.appendChild(rocketNameElement);
      headSectionElement.appendChild(statusElement);

      launchElement.appendChild(missionNameElement);
      launchElement.appendChild(countdownElement);
      launchElement.appendChild(locationElement);

      appDiv.appendChild(launchElement);

      function updateCountdown() {
        const now = new Date().getTime();
        const launchTime = new Date(result.net).getTime();
        const timeRemaining = launchTime - now;
      
        if (timeRemaining <= 0) {
          countdownElement.innerHTML = "W TRAKCIE";
          countdownElement.className = "wTrakcie";
        } if (timeRemaining < 4) {
          countdownElement.style.display = 'none';
        } else {
          const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
      
          const formattedHours = String(hours).padStart(2, '0');
          const formattedMinutes = String(minutes).padStart(2, '0');
          const formattedSeconds = String(seconds).padStart(2, '0');
      

          let countdownText = `T-${days} dni ${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
            if (days === 1) {
              countdownText = `T-${days} dzień ${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
            } else if (days === 0) {
              countdownText = `T-${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
            }
          countdownElement.innerHTML = countdownText;
        }
      }

      updateCountdown();
      setInterval(updateCountdown, 1000);
    }
  });
}

fetchData();
setInterval(fetchData, 10 * 60 * 1000);