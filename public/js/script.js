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
  "International Space Station": "Międzynarodowa Stacja Kosmiczna",
};

const MissionReplacements = {
  "Unknown Payload": "Ładunek nieznany",
  "Demo Flight": "Lot demonstracyjny",
  "Vostochny Angara Test Flight": "Angara Test Flight",
  "Space Mission": "",
  "CST-100 Starliner Crewed Flight Test": "Boeing Crewed Flight Test",
};

const EventIconMap = {
  "Dokowanie": "las la-satellite",
  "Odłączenie statku": "las la-satellite",
  "Zmiana dowództwa": "las la-satellite",
  "Ceremonia pożegnalna": "las la-satellite",
};

const RocketMap = {
  "Smart Dragon 1": "Jielong 1",
  "Smart Dragon 2": "Jielong 2",
  "Smart Dragon 3": "Jielong 3",
  "Docking": "Dokowanie",
  "Spacecraft Undocking": "Odłączenie statku",
  "Spacewalk": "Spacer kosmiczny",
  "Berthing": "Dokowanie",
  "Press Event": "Konferencja prasowa",
  "Farewell Ceremony": "Ceremonia pożegnalna",
  "Change of Command": "Zmiana dowództwa",
  "Spacecraft Landing": "Powrót na Ziemię",
  "Static Fire": "Test static fire",
  "Mir": "GYŪB",
};

const CustomStreamMap = {
  "Flight 13": "https://www.youtube.com/watch?v=4WzjGAX42Jc",
};

const months = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
const padZero = (num) => String(num).padStart(2, "0");
const flightInProgressThresholdMs = 45 * 60 * 1000;
const launchCards = [];
let countdownTimerId = null;
let isFetching = false;
let launchResults = [];

const renameRocket = (name) => {
  let renamed = mapValue(RocketMap, name).replace(/Long March (\d+)/g, "Chang Zheng $1");
  return renamed.replace(/\bSoyuz\b/gi, "Sojuz");
};

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
    .replace(/FLTA\d+\s*/, "")
    .replace(/\bSpaceSail\s+Polar\s+Group\s+TBD\b/gi, "Qianfan")
    .replace(/\bGroup\s+TBD\b/gi, "Qianfan")
    .replace(/\bGroup\s+(.+?)$/gi, "Grupa $1")
    .replace(/\bDocking\b/gi, "")
    .replace(/\bUndocking\b/gi, "")
    .replace(/\bSoyuz\b/gi, "Sojuz")
    .replace(/SDA Tranche (\d+) Transport Layer ([A-Za-z0-9]+)/g, "SDA Transza $1-$2")
    .replace(/StriX Launch (\d+)/g, "StriX-$1")
    .replace(/\d+\s*x\s*Rassvet-3/gi, "satelity Rassvet-3")
    .replace(/(?:ISS\s+)?Expedition\s+(\d+(?:-\d+)?)(?:\s+Change of Command Ceremony)?/gi, "Ekspedycja $1")
    .replace(/\s+Farewell\s+Ceremony/gi, "")
    .replace(/\s+Landing/gi, "")
    .replace(/\s+Pre-Launch/gi, "")
    .replace(/\s+(?:Mission\s+Overview|Crew)?\s*(?:News\s+Conference|Press\s+Conference|Media\s+Briefing)/gi, "")
    .replace(/\s+(?:Pre|Post)-Launch\s+(?:Media\s+Briefing|Press\s+Conference|Briefing)/gi, "");

  const match = updated.match(/Dragon CRS-2 SpX-(\d+)/);
  let finalName = match ? `CRS-${match[1]}` : updated;
  return finalName.replace(/\s+/g, " ").trim();
};

const removeTextAfterSlash = (text) => text.split("/")[0];

const getStatusAbbreviation = (status) => mapValue(StatusMap, status);
const translateLaunch = (location) => mapValue(LaunchLocationMap, location);
const getRocketReplacement = (rocket) => renameRocket(rocket);

function fetchData() {
  if (isFetching) {
    return;
  }

  isFetching = true;
  const cachedData = localStorage.getItem("cachedData");
  const cachedTimestamp = localStorage.getItem("cachedTimestamp");
  const currentTime = new Date().getTime();

  if (cachedData && cachedTimestamp && currentTime - Number(cachedTimestamp) <= 15 * 60 * 1000) {
    const parsed = JSON.parse(cachedData);
    launchResults = parsed.results || parsed;
    displayLaunchData(launchResults);
    isFetching = false;
    return;
  }

  NProgress.start();
  Promise.all([
    fetch("https://ll.thespacedevs.com/2.2.0/launch/upcoming/?mode=detailed&limit=16").then((res) => res.json()),
    fetch("https://ll.thespacedevs.com/2.2.0/event/upcoming/?mode=detailed&limit=16").then((res) => res.json())
  ])
    .then(([launchData, eventData]) => {
      const launches = launchData.results || [];
      const events = eventData.results || [];

      let maxLaunchDate = null;
      if (launches.length > 0) {
        maxLaunchDate = new Date(Math.max(...launches.map(l => new Date(l.net).getTime())));
      }

      const normalizedEvents = events
        .filter(e => {
          if (!maxLaunchDate) return true;
          return new Date(e.date).getTime() <= maxLaunchDate.getTime();
        })
        .map(e => ({
          id: `event-${e.id}`,
          isEvent: true,
          net: e.date,
          image: e.feature_image,
          mission: { name: e.name },
          rocket: { configuration: { name: e.type ? e.type.name : "Wydarzenie" } },
          pad: { location: { name: e.location ? e.location : "Nieznana lokalizacja" } },
          status: { name: "Go for Launch" },
          vidURLs: e.vidURLs || (e.video_url ? [{ url: e.video_url }] : [])
        }));

      const combinedResults = [...launches, ...normalizedEvents];

      localStorage.setItem("cachedData", JSON.stringify({ results: combinedResults }));
      localStorage.setItem("cachedTimestamp", String(currentTime));
      launchResults = combinedResults;
      displayLaunchData(launchResults);
    })
    .catch((err) => {
      console.error(err);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        launchResults = parsed.results || parsed;
        displayLaunchData(launchResults);
      }
    })
    .finally(() => {
      isFetching = false;
      NProgress.done();
    });
}

function createLaunchBackground(status, image) {
  const gradientMap = {
    "Pomyślny start": "rgba(46, 204, 113, 0.45)",
    "Nieudany start": "rgba(235, 77, 75, 0.45)",
    "CZĘŚCIOWA PORAŻKA": "rgba(243, 156, 18, 0.45)",
    "START WSTRZYMANY": "rgba(241, 196, 15, 0.45)",
    "Lot w trakcie": "rgba(52, 152, 219, 0.45)",
    "DATA POTWIERDZONA": "rgba(185, 103, 225, 0.45)",
    "DO POTWIERDZENIA": "rgba(155, 89, 182, 0.45)",
    "DO USTALENIA": "rgba(142, 68, 173, 0.45)"
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
      "GYŪB": "https://en.wikipedia.org/wiki/Solid-fuel_space_launch_vehicle",
    },
    location: {
      "Start w powietrzu": "https://en.wikipedia.org/wiki/Air_launch",
      "International Space Station": "https://en.wikipedia.org/wiki/International_Space_Station",
      "Międzynarodowa Stacja Kosmiczna": "https://en.wikipedia.org/wiki/International_Space_Station"
    }
  };

  const specialLink = specialLinks[type]?.[name];
  if (specialLink) return specialLink;

  if (type === "rocket") {
    const changZhengMatch = name.match(/^Chang Zheng\s+(\d+[A-Za-z]*)$/);
    if (changZhengMatch) {
      return `https://en.wikipedia.org/wiki/Long_March_${changZhengMatch[1]}`;
    }

    if (/^Sojuz\b/i.test(name)) {
      return `https://en.wikipedia.org/wiki/${name.replace(/^Sojuz/i, "Soyuz")}`;
    }
  }

  return `https://en.wikipedia.org/wiki/${name}`;
}

function createTextElement(text, className) {
  const element = document.createElement("p");
  element.textContent = text || "Nie ustalono";
  element.className = className;
  return element;
}

function updateCountdown(cardState) {
  const now = new Date().getTime();
  const launchTime = new Date(cardState.result.net).getTime();
  const hasValidLaunchTime = Number.isFinite(launchTime);
  const apiStatus = cardState.result?.status?.name;
  const translatedStatus = getStatusAbbreviation(apiStatus);
  const isTerminalStatus = ["Pomyślny start", "Nieudany start", "CZĘŚCIOWA PORAŻKA", "START WSTRZYMANY"].includes(translatedStatus);

  const timeSinceLaunch = hasValidLaunchTime ? now - launchTime : 0;
  const isLaunchTimePassed = hasValidLaunchTime && timeSinceLaunch >= 0;
  const isApiInFlight = apiStatus === "Launch in Flight";
  const shouldShowInFlight = hasValidLaunchTime && (isApiInFlight || (!isTerminalStatus && isLaunchTimePassed && timeSinceLaunch <= flightInProgressThresholdMs));

  let displayStatus = translatedStatus || cardState.status;

  if (shouldShowInFlight) {
    displayStatus = "Lot w trakcie";
  }

  const timeRemaining = isLaunchTimePassed ? 0 : Math.max(0, launchTime - now);
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
  const formatTime = [days, hours, minutes, seconds].map(padZero);

  let countdownText = formatTime.join(":");
  if (days > 2 && displayStatus === "DATA POTWIERDZONA") {
    countdownText = cardState.result.isEvent ? `Event za ${days} dni` : `Start za ${days} dni`;
  }

  if (isApiInFlight || displayStatus === "Lot w trakcie") {
    countdownText = "Lot w trakcie";
  } else if (displayStatus !== "DATA POTWIERDZONA") {
    countdownText = displayStatus;
  }

  cardState.status = displayStatus;

  cardState.element.style.backgroundImage = createLaunchBackground(displayStatus, cardState.result.image);

  let timeElement = cardState.countdownElement.querySelector("#czasElement");
  if (!timeElement) {
    timeElement = document.createElement("p");
    timeElement.id = "czasElement";
    cardState.countdownElement.appendChild(timeElement);
  }

  if (timeElement.textContent !== countdownText) {
    timeElement.textContent = countdownText;
  }

  if (days < 10 && displayStatus === "DATA POTWIERDZONA") {
    const tooltipLabel = `${cardState.launchDate.getDate()} ${months[cardState.launchDate.getMonth()]} ${cardState.launchDate.getFullYear()}, ${padZero(cardState.launchDate.getHours())}:${padZero(cardState.launchDate.getMinutes())}`;
    const tooltipContent = `<center>${tooltipLabel}</center>`;

    if (!cardState.tooltip) {
      cardState.tooltip = tippy(cardState.czasDiv, {
        content: tooltipContent,
        placement: "top",
        allowHTML: true
      });
    } else if (cardState.tooltipContent !== tooltipContent) {
      cardState.tooltip.setContent(tooltipContent);
    }

    cardState.tooltipContent = tooltipContent;
  } else if (cardState.tooltip) {
    cardState.tooltip.destroy();
    cardState.tooltip = null;
    cardState.tooltipContent = "";
  }
}

function updateAllCountdowns() {
  launchCards.forEach(updateCountdown);
}

function adjustGridRows() {
  const appDiv = document.getElementById("app");
  if (!appDiv) return;
  const articles = Array.from(appDiv.querySelectorAll("article.start"));
  if (articles.length === 0) return;

  articles.forEach(a => a.style.display = "");

  const columnsStr = window.getComputedStyle(appDiv).gridTemplateColumns;
  const gridColumns = columnsStr.split(" ").filter(c => parseFloat(c) > 0).length;

  if (gridColumns > 0) {
    const remainder = articles.length % gridColumns;
    if (remainder !== 0 && articles.length > gridColumns) {
      for (let i = articles.length - remainder; i < articles.length; i++) {
        articles[i].style.display = "none";
      }
    }
  }
}

window.addEventListener("resize", adjustGridRows);

function displayLaunchData(results) {
  const appDiv = document.getElementById("app");
  const fragment = document.createDocumentFragment();

  launchCards.length = 0;

  results
    .filter((result) => result.mission)
    .sort((a, b) => new Date(a.net) - new Date(b.net))
    .forEach((result) => {
      const launchElement = document.createElement("article");
      launchElement.className = "start";

      const rocketName = removeTextAfterSlash(result.rocket.configuration.name);
      const upgradedRocketName = getRocketReplacement(rocketName);
      const missionName = poprawaMisji(result.mission.name);
      const status = getStatusAbbreviation(result.status.name);
      const locationName = translateLaunch(result.pad.location.name.split(",")[0]);

      launchElement.style.backgroundImage = createLaunchBackground(status, result.image);

      const apiStreamUrl = result.vidURLs && result.vidURLs.length > 0 ? result.vidURLs[0].url : null;
      const streamUrl = CustomStreamMap[missionName] || CustomStreamMap[result.mission.name] || apiStreamUrl;

      if (streamUrl) {
        launchElement.classList.add("has-stream");

        const streamLink = document.createElement("a");
        streamLink.href = streamUrl;
        streamLink.target = "_blank";
        streamLink.rel = "noopener noreferrer";
        streamLink.className = "card-main-link";
        streamLink.title = "Oglądaj transmisję na żywo";
        
        launchElement.append(streamLink);
      }

      const rocketNameElement = createTextElement(upgradedRocketName, "nazwaRakiety");
      const missionNameElement = createTextElement(missionName, "nazwaMisji");
      missionNameElement.id = "nazwaMisji";

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

      let locationIconClass = "las la-map-marked-alt";
      if (result.isEvent) {
        locationIconClass = EventIconMap[upgradedRocketName] || "las la-map-marked-alt";
      }

      const mapIcon = createWikipediaIcon(locationIconClass, locationName, "location");
      mapIcon.id = "map";

      const starIcon = document.createElement("a");
      starIcon.className = "lar la-star";
      starIcon.id = "starIcon";

      tippy(starIcon, {
        content: `TBD`,
        placement: "top",
        allowHTML: true
      });

      const streamHolder = document.createElement("div");
      streamHolder.id = "streamIcon";

      const countdownElement = document.createElement("div");
      countdownElement.id = `countdown-${result.id}`;

      const info = document.createElement("div");
      info.className = "info";

      const czasDiv = document.createElement("div");
      czasDiv.className = "czasDiv";
      czasDiv.id = "czasDiv";

      streamHolder.append(starIcon);
      if (!result.isEvent) {
        const rocketIcon = createWikipediaIcon("las la-rocket", upgradedRocketName, "rocket");
        rocketIcon.id = "rocketIcon";
        streamHolder.append(rocketIcon);
      }
      if (locationName.toLowerCase() !== "online") {
        streamHolder.append(mapIcon);
      }
      info.append(missionNameElement, rocketNameElement);
      czasDiv.appendChild(countdownElement);

      launchElement.append(czasDiv, streamHolder, info);
      fragment.appendChild(launchElement);

      launchCards.push({
        element: launchElement,
        result,
        status,
        countdownElement,
        czasDiv,
        launchDate: new Date(result.net),
        tooltip: null,
        tooltipContent: ""
      });
    });

  appDiv.replaceChildren(fragment);
  launchCards.forEach(updateCountdown);

  if (!countdownTimerId) {
    countdownTimerId = window.setInterval(updateAllCountdowns, 1000);
  }

  adjustGridRows();
}

fetchData();
window.setInterval(fetchData, 10 * 60 * 1000);