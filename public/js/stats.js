const appDiv = document.getElementById("app");
const currentYear = new Date().getFullYear();

const countryMap = {
    "US": "USA",
    "CN": "Chiny",
    "IN": "Indie",
};
const mapCountry = (code) => countryMap[code.toUpperCase()] || code;

function parseStats(text) {
    const clean = (text || "").replace(/\s+/g, " ");
    const stats = {};

    const extract = (regex, index = 1) => {
        const match = clean.match(regex);
        return match ? match[index].replace(/,/g, "") : "0";
    };

    stats.totalAttempts = extract(/Total orbital attempts, all time:\s*([\d,]+)/i);
    stats.totalOrbit = extract(/Total launches to orbit, all time:\s*([\d,]+)/i);
    
    stats.attemptsYear = extract(new RegExp(`Total orbital attempts in\\s*${currentYear}:\\s*([\\d,]+)`, 'i'));
    stats.orbitYear = extract(new RegExp(`Total launches to orbit in\\s*${currentYear}:\\s*([\\d,]+)`, 'i'));
    
    const bestYearMatch = clean.match(/Biggest annual total\s*([\d,]+)\s*in\s*(\d{4})/i);
    stats.bestYear = bestYearMatch ? bestYearMatch[2] : "Brak";

    const countryYearMatch = clean.match(new RegExp(`Most by one country in\\s*${currentYear}:\\s*(\\d+)\\s*by\\s*([A-Z]{2,})`, 'i'));
    stats.countryYear = countryYearMatch ? `${countryYearMatch[1]} (${mapCountry(countryYearMatch[2])})` : "Brak";

    return stats;
}

function renderCards(stats) {
const cardsConfig = [
{ title: "Wszystkie starty", category: "Historyczne", value: `${stats.totalAttempts} lotów`, bgUrl: "./public/img/stats/1.webp" },
{ title: `w ${currentYear} roku`, category: "Starty", value: `${stats.attemptsYear} lotów`, bgUrl: "./public/img/stats/2.webp" },

{ title: "Udane orbity", category: "Historyczne", value: `${stats.totalOrbit} lotów`, bgUrl: "./public/img/stats/3.webp" },
{ title: `w ${currentYear}`, category: "Udane orbity", value: `${stats.orbitYear} lotów`, bgUrl: "./public/img/stats/4.webp" },

{ title: `Startów w ${currentYear}`, category: "Najwięcej", value: stats.countryYear, bgUrl: "./public/img/stats/5.webp" },
];

    const fragment = document.createDocumentFragment();

    cardsConfig.forEach(card => {
        const article = document.createElement("article");
        article.className = "start";
        article.style.backgroundImage = `linear-gradient(106deg, rgba(157, 80, 187, 0.60) -0.02%, rgba(110, 72, 170, 0.60) 99.98%), url(${card.bgUrl})`;

        article.innerHTML = `
            <div class="czasDiv" id="czasDiv">
                <div id="countdown-stat">
                    <p id="czasElement">${card.value}</p>
                </div>
            </div>
            <div class="info">
                <p class="nazwaRakiety">${card.category}</p>
                <p id="nazwaMisji">${card.title}</p>
            </div>
        `;
        fragment.appendChild(article);
    });

    appDiv.innerHTML = "";
    appDiv.appendChild(fragment);
}

function fetchStats() {
    if (typeof NProgress !== 'undefined') NProgress.start();
    
    fetch("https://r.jina.ai/https://planet4589.org/space/stats/launches.html")
        .then((res) => res.text())
        .then((text) => {
            const stats = parseStats(text);
            renderCards(stats);
        })
        .catch((err) => {
            console.error(err);
        })
        .finally(() => {
            if (typeof NProgress !== 'undefined') NProgress.done();
        });
}

fetchStats();