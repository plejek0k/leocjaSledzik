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
    "Air launch to Suborbital flight": "Start w powietrzu",
    "Jiuquan Satellite Launch Center": "Jiuquan Launch Center",
    "Xichang Satellite Launch Center": "Xichang Launch Center",
    "Taiyuan Satellite Launch Center": "Taiyuan Launch Center",
    "Wenchang Space Launch Site": "Wenchang Launch Site"
  };
  return launchPoprawka[locationName] || locationName;
}

function poprawaMisji(missionName) {
  const misjaPoprawka = {
    "Unknown Payload": "Ładunek nieznany",
  };

  const regex = /Dragon CRS-2 SpX-(\d+)/;
  const match = missionName.match(regex);
  
  if (match) {
    return "CRS-" + match[1];
  } else {
    return misjaPoprawka[missionName] || missionName;
  }
}

function skrotAgencji(agencyInfo) {
  const poprawkaAgencji = {
    "China Aerospace Science and Technology Corporation": "CASC",
    "Indian Space Research Organization": "ISRO"
  };
  return poprawkaAgencji[agencyInfo] || agencyInfo;
}

function brakOrbity(orbitInfo) {
  const brakOrbityPoprawka = {
    "N/A": "BRAK INFORMACJI",
    "Sub": "LOT SUBORBITALNY"
  };
  return brakOrbityPoprawka[orbitInfo] || orbitInfo;
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

      const dupaElement = document.createElement("div");
      dupaElement.className = "obrazekFrame";

      const rocketName = result.rocket.configuration.name;

      const missionName = poprawaMisji(result.mission.name.replace(/\(([^)]+)\)/g, ''));

      const rocketNameElement = document.createElement("p");
      rocketNameElement.textContent = `${rocketName}`;
      rocketNameElement.className = "nazwaRakiety";

      const missionNameElement = document.createElement("p");
      missionNameElement.textContent = `${missionName}`;
      missionNameElement.className = "nazwaMisji";
      missionNameElement.id = "nazwaMisji";

      const status = getStatusAbbreviation(result.status.name);
      const statusElement = document.createElement("p");
      statusElement.textContent = `${status}`;
      statusElement.className = "status";

      if (statusElement.innerHTML === "SUKCES") {
        statusElement.className = "udany";
        missionNameElement.className = "poMisji";
      } 
      if (statusElement.innerHTML === "PORAŻKA") {
        statusElement.className = "nieUdany";
        missionNameElement.className = "poMisji";
      }
      if (statusElement.innerHTML === "DO USTALENIA") {
        statusElement.className = "doUstalenia";
      }
      if (statusElement.innerHTML === "DO POTWIERDZENIA") {
        statusElement.className = "doPotwierdzenia";
      }
      if (statusElement.innerHTML === "DATA POTWIERDZONA") {
        statusElement.className = "potwierdzone";
      }

      const locationName = translateLaunch(result.pad.location.name.split(",")[0]);
      const locationElement = document.createElement("p");
      locationElement.innerHTML = `${locationName}`; 
      locationElement.className = "lokalizacja";

      const countdownElement = document.createElement("div");
      countdownElement.id = `countdown-${result.id}`;

      const poswiata = document.createElement("div");
      poswiata.className = "poswiata";

      const info = document.createElement("div");
      info.className = "info";

      const info2 = document.createElement("div");
      info2.className = "info2";

      const orbitInfo = brakOrbity(result.mission.orbit.abbrev);
      const orbitInfoElement = document.createElement("p");
      orbitInfoElement.textContent = `${orbitInfo}`;
      orbitInfoElement.className = "orbitInfo";

      const agencyInfo = skrotAgencji(result.launch_service_provider.name);
      const agencyInfoElement = document.createElement("p");
      agencyInfoElement.textContent = `${agencyInfo}`;
      agencyInfoElement.className = "agencyInfo";

      const wynikMisji = document.createElement("div");
      wynikMisji.className = "wynikMisji";

      dupaElement.appendChild(missionNameElement);
      launchElement.appendChild(dupaElement);
      dupaElement.appendChild(info);
      dupaElement.appendChild(info2);
      dupaElement.appendChild(wynikMisji);
      wynikMisji.appendChild(statusElement);
      info.appendChild(rocketNameElement);
      info.appendChild(locationElement);
      info2.appendChild(orbitInfoElement);
      info2.appendChild(agencyInfoElement);
      dupaElement.appendChild(poswiata);


      if (result.image) {
        dupaElement.style.backgroundImage = `url(${result.image})`;
        dupaElement.style.backgroundRepeat = "no-repeat";
        dupaElement.style.backgroundPosition = "center center";
        dupaElement.style.borderRadius = "14px";
      } else {
        dupaElement.style.backgroundImage = "url(./public/img/brak.png)";
        dupaElement.style.backgroundRepeat = "no-repeat";
        dupaElement.style.backgroundPosition = "center center";
        dupaElement.style.borderRadius = "14px";
      }

      const czasDiv = document.createElement("div");
      czasDiv.className = "czasDiv";
      czasDiv.id = "czasDiv";

      dupaElement.appendChild(czasDiv);
      czasDiv.appendChild(countdownElement);

      appDiv.appendChild(launchElement);

      function updateCountdown() {
        const now = new Date().getTime();
        const launchTime = new Date(result.net).getTime();
        const timeRemaining = launchTime - now;
        

        if (timeRemaining <= 0) {
          countdownElement.innerHTML = "W TRAKCIE";
          countdownElement.className = "wTrakcie";
        } 
        if (timeRemaining < 4) {
          countdownElement.style.display = 'none';
        } else {
          const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

          const formattedDays = String(days).padStart(2, '0');
          const formattedHours = String(hours).padStart(2, '0');
          const formattedMinutes = String(minutes).padStart(2, '0');
          const formattedSeconds = String(seconds).padStart(2, '0');

          let countdownText = `<div id="czasElement">          
          <div id="elementCzasuHolder">
              <div class="elementCzasu">
                  <div id="czasValue">${formattedDays}</div>
                  <div id="czasLabel">DNI</div>
              </div>
              <div class="elementCzasu">
                  <div id="czasValue">${formattedHours}</div>
                  <div id="czasLabel">GODZINY</div>
              </div>
              <div class="elementCzasu">
                  <div id="czasValue">${formattedMinutes}</div>
                  <div id="czasLabel">MINUTY</div>
              </div>
              <div class="elementCzasu">
                  <div id="czasValue">${formattedSeconds}</div>
                  <div id="czasLabel">SEKUNDY</div>
              </div>
          </div>
      </div>`;

          if (days === 1) {
            countdownText = `<div id="czasElement">          
            <div id="elementCzasuHolder">
                <div class="elementCzasu">
                    <div id="czasValue">${formattedDays}</div>
                    <div id="czasLabel">DZIEŃ</div>
                </div>
                <div class="elementCzasu">
                    <div id="czasValue">${formattedHours}</div>
                    <div id="czasLabel">GODZINY</div>
                </div>
                <div class="elementCzasu">
                    <div id="czasValue">${formattedMinutes}</div>
                    <div id="czasLabel">MINUTY</div>
                </div>
                <div class="elementCzasu">
                    <div id="czasValue">${formattedSeconds}</div>
                    <div id="czasLabel">SEKUNDY</div>
                </div>
            </div>
        </div>`;
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
