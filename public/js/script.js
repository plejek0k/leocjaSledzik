const mapValue = (map, key) => map[key] || key;

const StatusMap = {
  "To Be Confirmed": "DO POTWIERDZENIA",
  "Go for Launch": "DATA POTWIERDZONA",
  "To Be Determined": "DO USTALENIA",
  "Launch was a Partial Failure": "CZĘŚCIOWA PORAŻKA",
  "On Hold": "START WSTRZYMANY",
  "Launch Successful": "Pomyślny start",
  "Launch Failure": "Nieudany start",
  "Launch in Flight": "Lot w trakcie",
};

const LaunchLocationMap = {
  "Air launch to Suborbital flight": "Start w powietrzu",
  "SpaceX Space Launch Facility": "SpaceX Starbase",
  "Vandenberg SFB": "Vandenberg Space Force Base",
  "Onenui Station": "Rocket Lab Launch Complex 1",
  "Wallops Island": "Mid-Atlantic Regional Spaceport",
  "Cape Canaveral": "Cape Canaveral Space Force Station",
  "Pacific Spaceport Complex": "Pacific Spaceport Complex – Alaska",
};

const MissionReplacements = {
  "Unknown Payload": "Ładunek nieznany",
  "Vostochny Angara Test Flight": "Angara Test Flight",
  "Space Mission": "",
  "CST-100 Starliner Crewed Flight Test": "Boeing Crewed Flight Test",
};

const RocketMap = {
  "Smart Dragon 1": "Jielong 1",
  "Smart Dragon 2": "Jielong 2",
  "Smart Dragon 3": "Jielong 3"
};

const AgencyShortNames = {
  "China Aerospace Science and Technology Corporation": "CASC",
  "Indian Space Research Organization": "ISRO",
  "Russian Federal Space Agency (ROSCOSMOS)": "ROSCOSMOS",
  "Russian Space Forces": "Rosyjskie Siły Kosmiczne",
  "United Launch Alliance": "ULA",
  "Mitsubishi Heavy Industries": "MHI",
};

const OrbitMap = {
  "N/A": "BRAK INFORMACJI",
  "Sub": "LOT SUBORBITALNY",
  "Elliptical": "ELIPTYCZNA",
  "PO": "POLARNA",
  "LO": "KSIĘŻYCOWA",
};

const renameRocket = (name) => mapValue(RocketMap, name).replace(/Long March (\d+)/g, "Chang Zheng $1");

const poprawaMisji = (missionName) => {
  let updated = missionName.replace(/\(([^)]+)\)/g, "");

  updated = Object.entries(MissionReplacements).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(key, "g"), value),
    updated
  );

  updated = updated
    .replace(/\bCRS-\d+\b/g, "")
    .replace(/nk\b Group/g, "nk Grupa")
    .replace(/Integrated Flight Test (\d+)/g, "Starship Flight Test $1")
    .replace(/Flight (\d+)/g, "Flight $1")
    .replace(/FLTA\d+\s*/, "");

  const match = updated.match(/Dragon CRS-2 SpX-(\d+)/);
  return match ? `CRS-${match[1]}` : updated;
};

const removeTextAfterSlash = (text) => text.split("/")[0];

const getStatusAbbreviation = (status) => mapValue(StatusMap, status);
const translateLaunch = (location) => mapValue(LaunchLocationMap, location);
const getRocketReplacement = (rocket) => renameRocket(rocket);
const skrotAgencji = (agency) => mapValue(AgencyShortNames, agency);
const brakOrbity = (orbit) => mapValue(OrbitMap, orbit);

function fetchData() {
  const cachedData = localStorage.getItem("cachedData");
  const cachedTimestamp = localStorage.getItem("cachedTimestamp");
  const currentTime = new Date().getTime();

  if (cachedData && currentTime - cachedTimestamp <= 15 * 60 * 1000) {
    displayLaunchData(JSON.parse(cachedData).results);
    return;
  }

  fetch("https://ll.thespacedevs.com/2.2.0/launch/upcoming/?mode=detailed&limit=16")
    .then(res => res.json())
    .then(data => {
      localStorage.setItem("cachedData", JSON.stringify(data));
      localStorage.setItem("cachedTimestamp", currentTime);
      displayLaunchData(data.results);
    });
}

function createLaunchBackground(status, image) {
  const gradientMap = {
    "Pomyślny start": "rgba(110, 198, 118, 0.6)",
    "Nieudany start": "rgba(183, 65, 65, 0.6)",
    "CZĘŚCIOWA PORAŻKA": "rgba(183, 65, 65, 0.6)",
    "START WSTRZYMANY": "rgba(176, 177, 84, 0.6)",
    "Lot w trakcie": "rgba(88, 69, 96, 0.6)",
    "Do potwierdzenia": "rgba(88, 69, 96, 0.6)"
  };

  const backgroundColor = gradientMap[status] || "rgba(157, 80, 187, 0.60)";
  return image 
    ? `linear-gradient(106deg, ${backgroundColor} -0.02%, rgba(110, 72, 170, 0.60) 99.98%), url(${image})` 
    : "url(./public/img/brak.png)";
}

function createWikipediaLink(name, type) {
  const specialLinks = {
    rocket: {
      "Starship": "https://en.wikipedia.org/wiki/SpaceX_Starship",
      "Electron": "https://en.wikipedia.org/wiki/Rocket_Lab_Electron",
      "H3-22": "https://en.wikipedia.org/wiki/H3_(rocket)",
      "Spectrum": "https://en.wikipedia.org/wiki/Isar_Aerospace_Spectrum",

    },
    location: {
      "Start w powietrzu": "https://en.wikipedia.org/wiki/Air_launch"
    }
  };

  const specialLink = specialLinks[type]?.[name];
  return specialLink || `https://en.wikipedia.org/wiki/${name}`;
}

function displayLaunchData(results) {
  const appDiv = document.getElementById("app");
  appDiv.innerHTML = "";

  results
    .filter(result => result.mission)
    .sort((a, b) => new Date(a.net) - new Date(b.net))
    .forEach(result => {
      NProgress.start();

      const launchElement = document.createElement("article");
      launchElement.className = "start";
      launchElement.onloadend = NProgress.done();

      const rocketName = removeTextAfterSlash(result.rocket.configuration.name);
      const upgradedRocketName = getRocketReplacement(rocketName);

      const missionName = poprawaMisji(result.mission.name);
      const status = getStatusAbbreviation(result.status.name);
      const locationName = translateLaunch(result.pad.location.name.split(",")[0]);

      launchElement.style.backgroundImage = createLaunchBackground(status, result.image);

      const createTextElement = (text, className) => {
        const element = document.createElement("p");
        element.textContent = text || "Nie ustalono";
        element.className = className;
        return element;
      };

      const rocketNameElement = createTextElement(upgradedRocketName, "nazwaRakiety");
      const missionNameElement = createTextElement(missionName, "nazwaMisji");
      missionNameElement.id = "nazwaMisji";
      const statusElement = createTextElement(status, "status");

      const createWikipediaIcon = (className, linkText, type) => {
        const icon = document.createElement("a");
        icon.className = className;
        icon.href = createWikipediaLink(linkText, type);

        tippy(icon, {
          content: `<center>${linkText} na Wikipedii</center>`,
          placement: "top",
          allowHTML: true
        });

        return icon;
      };

      const mapIcon = createWikipediaIcon("las la-map-marked-alt", locationName, "location");
      mapIcon.id = "map";

      const rocketIcon = createWikipediaIcon("las la-rocket", upgradedRocketName, "rocket");
      rocketIcon.id = "rocketIcon";

      const streamHolder = document.createElement("a");
      streamHolder.id = "streamIcon";
      const countdownElement = document.createElement("div");
      countdownElement.id = `countdown-${result.id}`;

      const info = document.createElement("div");
      info.className = "info";
      
      const czasDiv = document.createElement("div");
      czasDiv.className = "czasDiv";
      czasDiv.id = "czasDiv";

      streamHolder.append(rocketIcon, mapIcon);
      info.append(missionNameElement, rocketNameElement);
      czasDiv.appendChild(countdownElement);
      
      launchElement.append(czasDiv, streamHolder, info);
      appDiv.appendChild(launchElement);

      function updateCountdown() {
        const now = new Date().getTime();
        const launchTime = new Date(result.net).getTime();
        const timeRemaining = launchTime - now;

        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        const padZero = num => String(num).padStart(2, "0");
        const formatTime = [days, hours, minutes, seconds].map(padZero);

        const launchDate = new Date(result.net);
        const months = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];

        let countdownText = `<p id="czasElement">${formatTime.join(':')}</p>`;

        if (days > 2) {
          countdownText = `<p id="czasElement">Start za ${days} dni</p>`;
        }

        if (statusElement.innerHTML !== "DATA POTWIERDZONA") {
          countdownText = `<p id="czasElement">${status}</p>`;
        }

        if (!document.getElementById("czasElement")) {
          const czasElement = document.createElement("p");
          czasElement.id = "czasElement";
          countdownElement.appendChild(czasElement);
        }
        countdownElement.innerHTML = countdownText;

        if (days < 10) {
          tippy(czasDiv, {
            content: `<center>${launchDate.getDate()} ${months[launchDate.getMonth()]} ${launchDate.getFullYear()}, ${padZero(launchDate.getHours())}:${padZero(launchDate.getMinutes())}</center>`,
            placement: "top",
            allowHTML: true
          });
        }
      }

      updateCountdown();
      setInterval(updateCountdown, 1000);
    });
}

fetchData();
setInterval(fetchData, 10 * 60 * 1000);