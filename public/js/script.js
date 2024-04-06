function getStatusAbbreviation(status) {
  const statusMap = {
    "To Be Confirmed": "DO POTWIERDZENIA",
    "Go for Launch": "DATA POTWIERDZONA",
    "To Be Determined": "DO USTALENIA",
    "Launch was a Partial Failure": "CZĘŚCIOWA PORAŻKA",
    "Launch Successful": "Pomyślny start",
    "Launch Failure": "Nieudany start",
    "On Hold": "START WSTRZYMANY",
    "Launch in Flight": "LOT w trakcie",
  };

  return statusMap[status] || status;
}

function translateLaunch(locationName) {
  const launchPoprawka = {
    "Air launch to Suborbital flight": "Start w powietrzu",
    "Jiuquan Satellite Launch Center": "Jiuquan Launch Center",
    "Xichang Satellite Launch Center": "Xichang Launch Center",
    "Taiyuan Satellite Launch Center": "Taiyuan Launch Center",
    "Wenchang Space Launch Site": "Wenchang Launch Site",
    "Baikonur Cosmodrome": "Baikonur",
    "SpaceX Space Launch Facility": "Boca Chica",
    "Satish Dhawan Space Centre": "Sriharikota Range",
    "Sea Launch": "Wody międzynarodowe",
    "Pacific Spaceport Complex": "Pacific Spaceport",
    "Shahrud Missile Test Site": "Shahroud",
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
      /*
        rocketNameElement.dataset.tippyContent =
        getTooltipContentForRocket(modifiedRocketName);
      
      tippy(rocketNameElement, {
        content: rocketNameElement.dataset.tippyContent,
        placement: "top",
        allowHTML: true,
      });

      function getTooltipContentForRocket(rocketName) {
        const tooltipRocket = {
          "Falcon 9":
            "<center>Rakieta wielokrotnego użytku wyprodukowana przez firmę SpaceX będąca pierwszą komercyjną rakietą, która wyniosła człowieka na orbitę</center>",
          "Long March 5":
            "<center>Chińska ciężka rakieta nośna opracowana przez Chińską Akademię Technologii Pojazdów Startowych, będąca najpotężniejszą rakietą z rodziny rakiet Long March</center>",
          "Hyperbola-1":
            "<center>Chińska rakieta składająca się z czterech stopni, które są zasilane wyłącznie paliwem stałym, bazująca na pociskach balistycznych DF-11 lub DF-15</center>",
          "Electron":
            "<center>Nowozelandzka rakieta nośna, będąca pierwszą rakietą zasilaną przez silnik z pompą elektryczną</center>",
          "Soyuz 2.1b":
            "<center>Zmodernizowana wersja radzieckiej trzystopniowej rakiety Sojuz z silnikiem RD-0124, ze zwiększoną ładownością do 8,2 ton</center>",
          "New Shepard":
            "<center>Suborbitalna rakieta wielokrotnego użytku opracowany z myślą o turystyce kosmicznej przez firmę Blue Origin, nazwany na cześć Alana Sheparda, który jako pierwszy Amerykanin poleciał w kosmos</center>",
          "Falcon Heavy":
            "<center>Superciężka rakieta nośna, która została zaprojektowana przez amerykańską firmę SpaceX</center>",
          "PSLV-DL":
            "<center>Wariant indyjskiej rakiety PSLV (oferującej start na orbity polarne), który ma dwa boostery</center>",
          "Long March 2":
            "<center>Rakieta nośna obsługiwana przez Chińską Republikę Ludową, przy czym sam rozwój rakiety odbywa się dzięki Chińskiej Akademii Technologii Pojazdów Startowych</center>",
          "Firefly Alpha":
            "<center>Dwustopniowy pojazd nośny opracowany przez amerykańską firmę Firefly Aerospace</center>",
          "Soyuz 2.1a":
            "<center>Zmodernizowana wersja radzieckiej trzystopniowej rakiety Sojuz, która przeszła z analogowego systemu sterowania na cyfrowy</center>",
          "Soyuz 2-1v":
            "<center>Zmodernizowana wersja radzieckiej trzystopniowej rakiety Sojuz bez bocznych boosterów</center>",
          "Kuaizhou":
            "<center>Rodzina trójstopniowych chińskich rakiet szybkiego reagowania zasilanych na paliwo stałe</center>",
          "Long March 11":
            "<center>Chińska czterostopniowa rakieta zasilana na paliwo stałe, opracowana przez China Aerospace Science and Technology Corporation</center>",
          "Long March 3B":
            "<center>Trójstopniowa rakieta z czterema boosterami, będąca najcięższym wariantem z rodziny rakiet Long March</center>",
          "Soyuz":
            "<center>Rodzina rosyjskich rakiet nośnych wyprodukowane przez Progress Rocket Space Center</center>",
          "Ceres-1":
            "<center>Chińska czterostopniowa rakieta, zasilana na paliwo stałe i przez hydrazynę w ostatnim stopniu</center>",
          "Long March 2C":
            "<center>Chińska rakieta nośna niskiego udźwigu wykorzystywana głównie do startów komercyjnych</center>",
          "Vulcan VC2S":
            "<center>Ciężka rakieta nośna wykorzystywana przez Siły Kosmiczne Stanów Zjednoczonych, w tej wersji wystartuje z dwoma boosterami</center>",
          "Kinetica 1":
            "<center>Rakieta nośna składająca się z czterech stopni, w całości zasilanych paliwem stałym</center>",
          "H-IIA 202":
            "<center>Jeden z wariantów japońskiej ciężkiej rakiety nośnej H-IIA, który ma dwa boostery</center>",
          "GSLV Mk II":
            "<center>Indyjka trzystopniowa rakieta nośna średniego udźwigu, używająca kriogenicznego silnika CE-7.5</center>",
          "Long March 7":
            "<center>Chińska rakieta nośna napędzana paliwem płynnym, będącą następcą rakiety Long March 2F</center>",
          "Gravity-1":
            "<center>Chińska rakieta nośna napędzana paliwem stałym, będąca w stanie wynieść ładunek o masie 6,5 ton na niską orbitę okołoziemską</center>",
          SpaceShipTwo:
            "<center>Wystrzeliwany z powietrza, suborbitalny samolot kosmiczny przeznaczony głównie do realizacji turystycznych lotów kosmicznych</center>",
          RS1: "<center>Dwustopniowa rakieta, napędzana na silnik rakietowy E2, który działa na naftę RP-1 i ciekły tlen</center>",
        };
        return (
          tooltipRocket[rocketName] || "Oops... Chyba nie ustawiłem tutaj opisu"
        );
      }
      */

      const missionNameElement = document.createElement("p");
      missionNameElement.textContent = `${missionName}`;
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

      const streamHolder = document.createElement("a");
      streamHolder.id = "streamIcon";

      const filteredURLs = result.vidURLs.filter(urlObject => {
        const publisher = urlObject.publisher;
        return publisher !== "Spaceflight Now" && publisher !== "SPACE AFFAIRS" && publisher !== "NASASpaceflight";
      });
      
      filteredURLs.sort((a, b) => a.priority - b.priority);
      
      if (filteredURLs.length > 0) {
        streamHolder.href = filteredURLs[0].url;
      } else {
        stream.className = "las la-video-slash";
        streamHolder.id = "noStreamIcon";
      }


      /*
      const locationElement = document.createElement("p");
      locationElement.innerHTML = `${locationName}`;
      locationElement.className = "lokalizacja";
      */

      const countdownElement = document.createElement("div");
      countdownElement.id = `countdown-${result.id}`;
      
      const info = document.createElement("div");
      info.className = "info";

      /*
      const orbitInfo = brakOrbity(result.mission.orbit.abbrev);
      const orbitInfoElement = document.createElement("p");
      orbitInfoElement.textContent = `${orbitInfo}`;
      orbitInfoElement.className = "orbitInfo";
      orbitInfoElement.dataset.tippyContent = getTooltipContentForOrbit(orbitInfo);

      tippy(orbitInfoElement, {
        content: orbitInfoElement.dataset.tippyContent,
        placement: "top",
        allowHTML: true
      });
      
      function getTooltipContentForOrbit(orbitInfo) {
        const tooltipOrbit = {
          "BRAK INFORMACJI": "<center>Docelowa orbita tego lotu nie została ujawniona</center>",
          "LEO": "<center>Orbita, która nie przekracza wysokości 2000 kilometrów nad powierzchnią Ziemii</center>",
          "POLARNA": "<center>Orbita polarna, dzięki której satelita przelatuje nad obydwoma biegunami Ziemi</center>",
          "LOT SUBORBITALNY": "<center>Lot, podczas którego obiekt dociera do przestrzeni kosmicznej, ale nie dochodzi do wejścia na orbitę</center>",
          "ELIPTYCZNA": "<center>Orbita eliptyczna to charakteryzująca się kształtem elipsy orbita, której ruch opisują prawa Keplera</center>",
          "GTO": "<center>Orbita geosynchroniczna to orbita odpowiadająca obrotowi Ziemi wokół własnej osi</center>",
          "SSO": "<center>Orbita, która, po której satelita wykonuje każdego roku jeden pełny obrót wokół Słońca</center>",
          "MEO": "<center>Średnia orbita okołoziemska, która znajduje się od wysokości 2000 kilometrów do 36&nbsp000 kilometrów</center>",
          "KSIĘŻYCOWA": "<center>Orbita, która przebiega wokół Księżyca</center>",

        };
        return tooltipOrbit[orbitInfo] || "Oops... Chyba nie ustawiłem tutaj opisu";
      }
      

      const agencyInfo = skrotAgencji(result.launch_service_provider.name);
      const agencyInfoElement = document.createElement("p");
      agencyInfoElement.textContent = `${agencyInfo}`;
      agencyInfoElement.className = "agencyInfo";
      agencyInfoElement.dataset.tippyContent =
        getTooltipContentForAgency(agencyInfo);

      tippy(agencyInfoElement, {
        content: agencyInfoElement.dataset.tippyContent,
        placement: "top",
        allowHTML: true,
      });

      function getTooltipContentForAgency(agencyInfo) {
        const tooltipAgency = {
          SpaceX:
            "<center>Amerykańska firma trudząca się transportem kosmicznym, założona przez Elona Muska</center>",
          iSpace:
            "<center>Założona w październiku 2016 roku chińska prywatna firma zajmująca się wystrzeliwaniem rakiet w przestrzeń kosmiczną</center>",
          ROSCOSMOS:
            "<center>Rządowa agencja odpowiedzialną za program kosmiczny Federacji Rosyjskiej i ogólne rosyjskie badania lotnicze</center>",
          "Blue Origin":
            "<center>Amerykański prywatny producent lotniczy i firma świadcząca usługi lotów kosmicznych, która została założona przez Jeffa Bezosa</center>",
          ISRO: "<center>Indyjska agencją kosmiczna, której główną wizją jest wykorzystywanie technologii kosmicznej do rozwoju Indii przy jednoczesnym prowadzeniu badań naukowych</center>",
          CASC: "<center>Główny wykonawca chińskiego programu kosmicznego, powołany w lipcu 1999 roku</center>",
          "Rocket Lab":
            "<center>Amerykańska firma z branży lotniczej i kosmicznej, która posiada spółkę zależną w Nowej Zelandii, która opracowuje komercyjne rakiety nośne</center>",
          "Firefly Aerospace":
            "<center>Amerykańska firma, która opracowuje rakiety nośne do komercyjnych lotów w kosmos</center>",
          "Rosyjskie Siły Kosmiczne":
            "<center>Wojska federacji rosyjskiej, których zadaniami jest przede wszystkim obrona antybalistyczna kraju oraz kontrola satelitów wojskowych</center>",
          ExPace:
            "<center>Chińska spółka należąca w całości do China Aerospace Science and Industry Corporation, która specjalizuje się w komercyjnych startach rakiet</center>",
          "Galactic Energy":
            "<center>Chińska prywatna firma zajmująca się komercyjnym wysyłaniem rakiet w kosmos oraz wydobywaniem rzadkich metali asteroid</center>",
          ULA: "<center>Amerykańska spółka zajmująca się wynoszeniem ładunków w przestrzeń kosmiczną</center>",
          "CAS Space":
            "<center>Chińska firma zajmująca się komercyjnym wysyłaniem ładunków w przestrzeń kosmiczną częściowo należące do Chińskiej Akademii Nauk</center>",
          MHI: "<center>Japońska międzynarodowa korporacja zajmująca się inżynierią oraz urządzeniami elektrycznymi</center>",
          "Orienspace Technology":
            "<center>Chińskie przedsiębiorstwo projektujące rakiety nośne Gravity Series oraz silniki Force Series</center>",
          "Virgin Galactic":
            "<center>Amerykańska firma projektująca statki kosmiczne, które zapewniają loty swoim klientom</center>",
          "ABL Space Systems":
            "<center>Amerykański dostawca usług kosmicznych, produkujący rakiety nośne oraz zapewniający warunki do wysyłania komercyjnych satelitów</center>",
        };
        return (
          tooltipAgency[agencyInfo] || "Oops... Chyba nie ustawiłem tutaj opisu"
        );
      }


      tippy(statusElement, {
        content: statusElement.dataset.tippyContent,
        placement: "top",
        allowHTML: true,
      });

      function getTooltipContentForResult(statusElement) {
        const tooltipResult = {
          "SUKCES":
            "<center>Pomyślnie wyniesiono ładunek na docelową orbitę</center>",
          "DATA POTWIERDZONA":
            "<center>Data została potwierdzona przez oficjalne źródła</center>",
          "DO POTWIERDZENIA":
            "<center>Oczekiwanie na oficjalne potwierdzenie daty, która jest mniej więcej znana</center>",
          "DO USTALENIA":
            "<center>Data jest bardzo przybliżona i jest oparta na niewiarygodnych źródłach</center>",
          "WSTRZYMANO":
            "<center>Odliczanie zostało wstrzymane, a start może nastąpić w przewidzianym oknie startowym</center>",
          "CZĘŚCIOWA PORAŻKA":
            "<center>Osiągnięto orbitę, lecz nie dostarczono ładunku na docelową orbitę lub coś uniemożliwia uznać tej misji za udaną...</center>",
          "W TRAKCIE": "<center>Ten start właśnie się odbywa!</center>",
        };
        return (
          tooltipResult[statusElement] ||
          "Oops... Chyba nie ustawiłem tutaj opisu"
        );
      }
*/
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
          content: "<center>Transmisja startu jest dostępna!</center>",
          placement: "top",
          allowHTML: true
        });
      }
      else {
        tippy(stream, {
          content: "<center>Brak transmisji lub nie została ona zapowiedziana</center>",
          placement: "top",
          allowHTML: true
        });
      }
      

      launchElement.appendChild(czasDiv);
      launchElement.appendChild(streamHolder);
      streamHolder.appendChild(stream);
      launchElement.appendChild(info);
      info.appendChild(missionNameElement);
      info.appendChild(rocketNameElement);
      czasDiv.appendChild(countdownElement);
      appDiv.appendChild(launchElement);



      //launchElement.appendChild(wynikMisji);
      //czasDiv.appendChild(statusElement);
      //info.appendChild(locationElement);
      //info2.appendChild(orbitInfoElement);
      //info2.appendChild(agencyInfoElement);

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
          stream.style.display = "none";
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
      
        // Wywołanie tippy tylko raz
        tippy(czasDiv, {
          content: '<center>'+day+` `+month+` `+year+`, `+formatHour+`:`+formatSec+'</center>',
          placement: "top",
          allowHTML: true
        });
      }
      
      updateCountdown();
      setInterval(updateCountdown, 1000);      
    }
    
  });
}

fetchData();
setInterval(fetchData, 10 * 60 * 1000);
