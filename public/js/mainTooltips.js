const github = document.getElementById("github");
const baza = document.getElementById("baza");
const staty = document.getElementById("staty");

tippy(github, {
  content: "Repozytorium Github",
  placement: "bottom",
});
tippy(baza, {
  content: "Bazy wiedzy (TBD)",
  placement: "bottom",
});
tippy(staty, {
  content: "Statystyki",
  placement: "bottom",
});
