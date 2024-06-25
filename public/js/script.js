function getStatusAbbreviation(status) {
  const statusMap = {
    "To Be Confirmed": "DO POTWIERDZENIA",
    "Go for Launch": "DATA POTWIERDZONA",
    "To Be Determined": "DO USTALENIA",
    "Launch was a Partial Failure": "CZĘŚCIOWA PORAŻKA",
    "Launch Successful": "Pomyślny start",
    "Launch Failure": "Nieudany start",
    "On Hold": "START WSTRZYMANY",
    "Launch in Flight": "Lot w trakcie",
  };

  return statusMap[status] || status;
}

function translateLaunch(locationName) {
  const launchPoprawka = {
    "Air launch to Suborbital flight": "Start w powietrzu",
    "SpaceX Space Launch Facility": "SpaceX Starbase",
    "Vandenberg SFB": "Vandenberg Space Force Base",
    "Onenui Station": "Rocket Lab Launch Complex 1",
    "Wallops Island": "Mid-Atlantic Regional Spaceport",
    "Cape Canaveral": "Cape Canaveral Space Force Station",
  };
  return launchPoprawka[locationName] || locationName;
}

function poprawaMisji(missionName) {
  const misjaPoprawka = {
    "Unknown Payload": "Ładunek nieznany",
    "Vostochny Angara Test Flight": "Angara Test Flight",
  };

  const replacements = {
    "Space Mission": "",
    "CST-100 Starliner Crewed Flight Test": "Boeing Crewed Flight Test",
  };

  let dynamicMissionName = missionName;

  Object.keys(replacements).forEach((key) => {
    dynamicMissionName = dynamicMissionName.replace(
      new RegExp(key, "g"),
      replacements[key]
    );
  });

  dynamicMissionName = dynamicMissionName.replace(/\bCRS-\d+\b/g, "");
  dynamicMissionName = dynamicMissionName.replace(/nk\b Group/g, "nk Grupa");
  const missionWithoutFLTA = dynamicMissionName.replace(/FLTA\d+\s*/, "");

  const regex = /Dragon CRS-2 SpX-(\d+)/;
  const match = missionWithoutFLTA.match(regex);

  if (match) {
    return "CRS-" + match[1];
  } else {
    return misjaPoprawka[missionName] || missionWithoutFLTA;
  }
}

function skrotAgencji(agencyInfo) {
  const poprawkaAgencji = {
    "China Aerospace Science and Technology Corporation": "CASC",
    "Indian Space Research Organization": "ISRO",
    "Russian Federal Space Agency (ROSCOSMOS)": "ROSCOSMOS",
    "Russian Space Forces": "Rosyjskie Siły Kosmiczne",
    "United Launch Alliance": "ULA",
    "Mitsubishi Heavy Industries": "MHI",
  };
  return poprawkaAgencji[agencyInfo] || agencyInfo;
}

function brakOrbity(orbitInfo) {
  const brakOrbityPoprawka = {
    "N/A": "BRAK INFORMACJI",
    Sub: "LOT SUBORBITALNY",
    Elliptical: "ELIPTYCZNA",
    PO: "POLARNA",
    LO: "KSIĘŻYCOWA",
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

  const urlRocket = "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?mode=detailed&limit=16";

  fetch(urlRocket)
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
      NProgress.start();

      launchElement.onloadend = NProgress.done();

      const rocketName = result.rocket.configuration.name;
      const missionName = poprawaMisji(
        result.mission.name.replace(/\(([^)]+)\)/g, "")
      );

      function removeTextAfterSlash(inputText) {
        const slashIndex = inputText.indexOf("/");
        if (slashIndex !== -1) {
          return inputText.substring(0, slashIndex);
        } else {
          return inputText;
        }
      }

      const modifiedRocketName = removeTextAfterSlash(rocketName);

      const rocketNameElement = document.createElement("p");
      rocketNameElement.textContent = `${modifiedRocketName}`;
      rocketNameElement.className = "nazwaRakiety";

      const missionNameElement = document.createElement("p");
      if (missionName === null || missionName === "") {
        missionNameElement.textContent = "Nie ustalono";
      } else {
        missionNameElement.textContent = `${missionName}`;
      }
      missionNameElement.className = "nazwaMisji";
      missionNameElement.id = "nazwaMisji";

      const status = getStatusAbbreviation(result.status.name);
      const statusElement = document.createElement("p");
      statusElement.textContent = `${status}`;
      statusElement.className = "status";

      const locationName = translateLaunch(
        result.pad.location.name.split(",")[0]
      );

      const stream = document.createElement("i");
      stream.className = "las la-video";
      stream.id = "video";

      const map = document.createElement("a");
      map.className = "las la-map-marked-alt";
      map.id = "map";
      if (locationName == "Start w powietrzu") {
        map.href = "https://en.wikipedia.org/wiki/Air_launch"
      } else {
        map.href = "https://en.wikipedia.org/wiki/"+locationName;
      }
      

      tippy(map, {
        content: `<center>${locationName}</center>`,
        placement: "top",
        allowHTML: true
      });

      const streamHolder = document.createElement("a");
      streamHolder.id = "streamIcon";

      const filteredURLs = result.vidURLs.filter(urlObject => {
        const publisher = urlObject.publisher;
        return publisher !== "Spaceflight Now" && publisher !== "SPACE AFFAIRS" && publisher !== "NASASpaceflight";
      });
      
      filteredURLs.sort((a, b) => a.priority - b.priority);
      
      if (filteredURLs.length > 0) {
        stream.href = filteredURLs[0].url;
      } else {
        stream.className = "las la-video-slash";
        streamHolder.id = "noStreamIcon";
      }

      const countdownElement = document.createElement("div");
      countdownElement.id = `countdown-${result.id}`;
      
      const info = document.createElement("div");
      info.className = "info";

      if (result.image) {
        launchElement.style.backgroundImage = `linear-gradient(106deg, rgba(157, 80, 187, 0.60) -0.02%, rgba(110, 72, 170, 0.60) 99.98%), url(${result.image})`;
      } else {
        launchElement.style.backgroundImage = "url(./public/img/brak.png)";
      }

      const czasDiv = document.createElement("div");
      czasDiv.className = "czasDiv";
      czasDiv.id = "czasDiv";

      if (stream.className === "las la-video") {
        tippy(stream, {
          content: "<center>Transmisja jest dostępna</center>",
          placement: "top",
          allowHTML: true
        });
      }else {
        tippy(stream, {
          content: "<center>Brak dostępnej transmisji</center>",
          placement: "top",
          allowHTML: true
        });
      }
      

      launchElement.appendChild(czasDiv);
      launchElement.appendChild(streamHolder);
      streamHolder.appendChild(stream);
      streamHolder.appendChild(map);
      launchElement.appendChild(info);
      info.appendChild(missionNameElement);
      info.appendChild(rocketNameElement);
      czasDiv.appendChild(countdownElement);
      appDiv.appendChild(launchElement);

      function updateCountdown() {
        const now = new Date().getTime();
        const launchTime = new Date(result.net).getTime();
        const timeRemaining = launchTime - now;
      
        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
      
        const formattedDays = String(days).padStart(2, "0");
        const formattedHours = String(hours).padStart(2, "0");
        const formattedMinutes = String(minutes).padStart(2, "0");
        const formattedSeconds = String(seconds).padStart(2, "0");
      
        const launchDate = new Date(result.net);
        const day = launchDate.getDate();
        const year = launchDate.getFullYear();
        const monthIndex = launchDate.getMonth();
        const months = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
        const month = months[monthIndex];
        const hour = launchDate.getHours();
        const minute = launchDate.getMinutes();
        const formatHour = String(hour).padStart(2, "0");
        const formatSec = String(minute).padStart(2, "0");
      
        let countdownText = `<p id="czasElement">${formattedDays}:${formattedHours}:${formattedMinutes}:${formattedSeconds}</p>`;
      
        if (days === 1) {
          countdownText = `<p id="czasElement">${formattedDays}:${formattedHours}:${formattedMinutes}:${formattedSeconds}</p>`;
          stream.style.display = "inline-block";
        } if (days > 2) {
          countdownText = `<p id="czasElement">Start za ${days} dni</p>`;
        } 
      
        if (statusElement.innerHTML !== "DATA POTWIERDZONA") {
          countdownText = `<p id="czasElement">${status}</p>`;
        }
      
        if (statusElement.innerHTML === "Pomyślny start") {
          launchElement.style.backgroundImage = `linear-gradient(106deg, rgba(110, 198, 118, 0.6) -0.02%, rgba(110, 72, 170, 0.6) 99.98%), url(${result.image})`;
        }
        if (statusElement.innerHTML === "Nieudany start") {
          launchElement.style.backgroundImage = `linear-gradient(106deg, rgba(183, 65, 65, 0.6) -0.02%, rgba(110, 72, 170, 0.6) 99.98%), url(${result.image})`;
        }
        if (statusElement.innerHTML === "CZĘŚCIOWA PORAŻKA") {
          launchElement.style.backgroundImage = `linear-gradient(106deg, rgba(183, 65, 65, 0.6) -0.02%, rgba(110, 72, 170, 0.6) 99.98%), url(${result.image})`;
        }
        if (statusElement.innerHTML === "START WSTRZYMANY") {
          launchElement.style.backgroundImage = `linear-gradient(106deg, rgba(176, 177, 84, 0.6) -0.02%, rgba(110, 72, 170, 0.6) 99.98%), url(${result.image})`;
        }
        if (statusElement.innerHTML === "Lot w trakcie") {
          launchElement.style.backgroundImage = `linear-gradient(106deg, rgba(88, 69, 96, 0.6) -0.02%, rgba(110, 72, 170, 0.6) 99.98%), url(${result.image})`;
        }
        if (statusElement.innerHTML === "Do potwierdzenia") {
          launchElement.style.backgroundImage = `linear-gradient(106deg, rgba(88, 69, 96, 0.6) -0.02%, rgba(110, 72, 170, 0.6) 99.98%), url(${result.image})`;
        }
      
        countdownElement.innerHTML = countdownText;
        if (days < 10) {
          tippy(czasDiv, {
            content: '<center>'+day+` `+month+` `+year+`, `+formatHour+`:`+formatSec+'</center>',
            placement: "top",
            allowHTML: true
          });
        } 
      }
      
      updateCountdown();
      setInterval(updateCountdown, 1000);      
    }
    
  });
}

fetchData();
setInterval(fetchData, 10 * 60 * 1000);
