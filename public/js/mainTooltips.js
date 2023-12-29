const unu = document.getElementById("unu");
const du = document.getElementById("du");
const tri = document.getElementById("tri");
const kvar = document.getElementById("kvar");

const leocja = document.getElementById("leocja");
const edel = document.getElementById("edel");
const vox = document.getElementById("vox");
const nor = document.getElementById("nor");


//tooltipy do ikonek
tippy(unu, {
  content: "Kamery na żywo z Boca Chica",
  placement: "bottom",
});
tippy(du, {
  content: "Bazy wiedzy (TBD)",
  placement: "bottom",
});
tippy(tri, {
  content: "Mikronacyjne starty (TBD)",
  placement: "bottom",
});
tippy(kvar, {
  content: "Statystyki (TBD)",
  placement: "bottom",
});

//kraje
tippy(leocja, {
  content: "Palatynat Leocji",
  placement: "bottom",
});
tippy(edel, {
  content: "Kotlina Edelweiss",
  placement: "bottom",
});
tippy(vox, {
  content: "Królestwo Voxlandu",
  placement: "bottom",
});
tippy(nor, {
  content: "Federacja Nordacka",
  placement: "bottom",
});

