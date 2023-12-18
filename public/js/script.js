function getStatusAbbreviation(status) {
  const statusMap = {
    "To Be Confirmed": "DO POTWIERDZENIA",
    "Go for Launch": "DATA POTWIERDZONA",
    "To Be Determined": "DO USTALENIA",
    "Launch was a Partial Failure": "CZĘŚCIOWA PORAŻKA",
    "Launch Successful": "SUKCES",
    "Launch Failure": "PORAŻKA",
    "On Hold": "WSTRZYMANO",
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
  };
  return launchPoprawka[locationName] || locationName;
}

function poprawaMisji(missionName) {
  const misjaPoprawka = {
    "Unknown Payload": "Ładunek nieznany",
  };

  const missionWithoutFLTA = missionName.replace(/FLTA\d+\s*/, '');
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
  };
  return poprawkaAgencji[agencyInfo] || agencyInfo;
}

function brakOrbity(orbitInfo) {
  const brakOrbityPoprawka = {
    "N/A": "BRAK INFORMACJI",
    "Sub": "LOT SUBORBITALNY",
    "Elliptical": "ELIPTYCZNA",
    "PO": "POLARNA",
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

      const missionName = poprawaMisji(
        result.mission.name.replace(/\(([^)]+)\)/g, "")
      );

      const rocketNameElement = document.createElement("p");
      rocketNameElement.textContent = `${rocketName}`;
      rocketNameElement.className = "nazwaRakiety";
      rocketNameElement.dataset.tippyContent = getTooltipContentForRocket(rocketName);
      
      tippy(rocketNameElement, {
        content: rocketNameElement.dataset.tippyContent,
        placement: "top",
        allowHTML: true
      });
      
      function getTooltipContentForRocket(rocketName) {
        const tooltipRocket = {
          "Falcon 9": "<center>Rakieta wielokrotnego użytku wyprodukowana firmę SpaceX będąca pierwszą komercyjną rakietą, która wyniosła człowieka na orbitę i obecnie jest jedyną amerykańską rakietą, która może to zrobić</center>",
          "Long March 5": "<center>Chińska ciężka rakieta nośna opracowana przez Chińską Akademię Technologii Pojazdów Startowych, będąca najpotężniejszą rakietą z rodziny rakiet Long March</center>",
          "Hyperbola-1": "<center>Chińska rakieta składająca się z czterech stopni, które są zasilane wyłącznie paliwem stałym, bazująca na pociskach balistycznych DF-11 lub DF-15</center>",
          "Electron": "<center>Nowozelandzka dwustopniowa rakieta opracowana przez firmę Rocket Lab będąca pierwszą rakietą zasilaną przez silnik z pompą elektryczną</center>",
          "Soyuz 2.1b/Fregat-M": "<center>Zmodernizowana wersja radzieckiej trzystopniowej rakiety Sojuz z silnikiem RD-0124, ze zwiększoną ładownością do 8,2 ton</center>",
          "New Shepard": "<center>Suborbitalna rakieta wielokrotnego użytku opracowany z myślą o turystyce kosmicznej przez firmę Blue Origin, nazwany na cześć Alana Sheparda, który jako pierwszy Amerykanin poleciał w kosmos</center>",
          "Falcon Heavy": "<center>Superciężka rakieta nośna, która została zaprojektowana przez amerykańską firmę SpaceX</center>",
          "PSLV-DL": "<center>Jeden z wariantów indyjskiej rakiety PSLV, który ma tylko dwa boostery i jest w stanie wystrzelić ładunek na orbitę synchroniczną ze Słońcem</center>",
          "Long March 2": "<center>Rakieta nośna obsługiwana przez Chińską Republikę Ludową, przy czym sam rozwój rakiety odbywa się dzięki Chińskiej Akademii Technologii Pojazdów Startowych</center>",
          "Firefly Alpha": "<center>Dwustopniowy pojazd nośny opracowany przez amerykańską firmę Firefly Aerospace</center>",
        };
        return tooltipRocket[rocketName] || "Oops... Chyba nie ustawiłem tutaj opisu";
      }

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
      if (statusElement.innerHTML === "WSTRZYMANO") {
        statusElement.className = "doUstalenia";
      }

      const locationName = translateLaunch(
        result.pad.location.name.split(",")[0]
      );
      const locationElement = document.createElement("p");
      locationElement.innerHTML = `${locationName}`;
      locationElement.className = "lokalizacja";

      const countdownElement = document.createElement("div");
      countdownElement.id = `countdown-${result.id}`;

      const info = document.createElement("div");
      info.className = "info";

      const info2 = document.createElement("div");
      info2.className = "info2";

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
          "LEO": "<center>Czyli taka, która nie przekracza wysokości 2000 kilometrów nad powierzchnią Ziemii</center>",
          "POLARNA": "<center>Orbita polarna, czyli taka gdzie satelita przelatuje nad obydwoma biegunami Ziemi gdzie jej nachylenie jest w granicach od 60 do 90 stopni</center>",
          "LOT SUBORBITALNY": "<center>To taki lot, podczas którego dociera do przestrzeni kosmicznej, ale trajektoria lotu nie pozwala na wejście na orbitę</center>",
          "ELIPTYCZNA": "<center>Orbita eliptyczna to orbita kołowa z mimośrodem (parametr o ile jakaś orbita odbiega od idealnego koła), który jest równy 1</center>",
          "GTO": "<center>Orbita geosynchroniczna to orbita z okresem orbitalnym odpowiadającym obrotowi Ziemi, który wokół własnej osi wynoszącym 1 dzień gwiezdny</center>",
        };
        return tooltipOrbit[orbitInfo] || "Oops... Chyba nie ustawiłem tutaj opisu";
      }


      const agencyInfo = skrotAgencji(result.launch_service_provider.name);
      const agencyInfoElement = document.createElement("p");
      agencyInfoElement.textContent = `${agencyInfo}`;
      agencyInfoElement.className = "agencyInfo";
      agencyInfoElement.dataset.tippyContent = getTooltipContentForAgency(agencyInfo);

      tippy(agencyInfoElement, {
        content: agencyInfoElement.dataset.tippyContent,
        placement: "top",
        allowHTML: true
      });
      
      function getTooltipContentForAgency(agencyInfo) {
        const tooltipAgency = {
          "SpaceX": "<center>Amerykańska firma świadcząca usługi transportu kosmicznego, która została założona w 2002 roku przez Elona Muska w celu obniżenia kosztów transportu kosmicznego</center>",
          "iSpace": "<center>Założona w październiku 2016 roku chińska prywatna firma zajmująca się rozwojem i wystrzeliwaniem rakiet w przestrzeń kosmiczną</center>",
          "ROSCOSMOS": "<center>Rządowa agencja odpowiedzialną za program kosmiczny Federacji Rosyjskiej i ogólne rosyjskie badania lotnicze</center>",
          "Blue Origin": "<center>Amerykański prywatny producent lotniczy i firma świadcząca usługi lotów kosmicznych, która została założona przez Jeffa Bezosa</center>",
          "ISRO": "<center>Indyjska agencją kosmiczna, której główną wizją jest wykorzystywanie technologii kosmicznej do rozwoju Indii przy jednoczesnym prowadzeniu badań naukowych</center>",
          "CASC": "<center>Główny wykonawca chińskiego programu kosmicznego, który został oficjalnie powołany w lipcu 1999 roku przez rząd Chińskiej Republiki Ludowej</center>",
          "Rocket Lab": "<center>Amerykańska firma z branży lotniczej i kosmicznej, która posiada spółkę zależną w Nowej Zelandii, która opracowuje komercyjne rakiety nośne</center>",
          "Firefly Aerospace": "<center>Amerykańska firma z branży kosmicznej, która opracowuje rakiety nośne do komercyjnych lotów w kosmos</center>",
        };
        return tooltipAgency[agencyInfo] || "Oops... Chyba nie ustawiłem tutaj opisu";
      }

      const wynikMisji = document.createElement("div");
      wynikMisji.className = "wynikMisji";
      statusElement.dataset.tippyContent = getTooltipContentForResult(status);

      tippy(statusElement, {
        content: statusElement.dataset.tippyContent,
        placement: "top",
        allowHTML: true
      });
      
      function getTooltipContentForResult(statusElement) {
        const tooltipResult = {
          "SUKCES": "<center>Pomyślnie wyniesiono ładunek na docelową orbitę</center>",
          "DATA POTWIERDZONA": "<center>Data została potwierdzona przez oficjalne źródła</center>",
          "DO POTWIERDZENIA": "<center>Oczekiwanie na oficjalne potwierdzenie daty, która jest mniej więcej znana</center>",
          "DO USTALENIA": "<center>Data jest bardzo przybliżona i jest oparta na niewiarygodnych źródłach</center>",
          "WSTRZYMANO": "<center>Odliczanie zostało wstrzymane, a start może nastąpić w przewidzianym oknie startowym</center>"
        };
        return tooltipResult[statusElement] || "Oops... Chyba nie ustawiłem tutaj opisu";
      }


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
          countdownElement.style.display = "none";
        } else {
          const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor(
            (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

          const formattedDays = String(days).padStart(2, "0");
          const formattedHours = String(hours).padStart(2, "0");
          const formattedMinutes = String(minutes).padStart(2, "0");
          const formattedSeconds = String(seconds).padStart(2, "0");

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
