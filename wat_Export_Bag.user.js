// ==UserScript==
// @name            Fork de Export_Bag
// @namespace       fr.kergoz-panic.watilin
// @description     Fork du script Export_Bag de Asmodai (naturaloutil.immae.eu)
// @version         1.0
// @originalAuthor  Asmodai
// @author          Watilin
//
// @include         http://www.naturalchimie.com/act/bag
//
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_addStyle
// @noframes
// @nocompat
// ==/UserScript==

"use strict";

// polyfills pour Chrome ///////////////////////////////////////////////

["forEach", "map"].forEach(function(method) {
  if (!(method in Array)) {
    Array[method] = function(collection, callback) {
      return Array.prototype[method].call(collection, callback);
    };
  }
});

// Variables du script /////////////////////////////////////////////////

var url_outil = GM_getValue("url_naturaloutil", "");

// recherche de l'ID naturalchimie sur le lien "page personnelle"
var $lab = document.querySelector(".lab");
var id_na2 = /user\/(\d+)/.exec($lab.href)[1];

// utilise l'ID Naturalchimie pour récupérer une paire joueur/clé
var joueur = GM_getValue("joueur_" + id_na2, "");
var cle = GM_getValue("cle_GM_" + id_na2, "");

// Récupération des données ////////////////////////////////////////////

// init des tableaux permettant le tri
var liste_objets = [];

for (var i = 0; i < 29; i++) liste_objets.push('elt' + i);
liste_objets = liste_objets.concat([
  "pa", "menthol", "questobjgeminishregular", "questobjmilk",
  "questobjchocapic", "surprise0", "surprise1", "stamp", "godfather",
  "catz", "pumpkin0", "pumpkin1", "pumpkin2", "gift", "nowelball",
  "choco", "snowball", "empty", "alchimoth", "dalton", "delorean0",
  "delorean1"
]);
for (i = 0; i < 29; i++) liste_objets.push("destroyer" + i);
liste_objets = liste_objets.concat([
  "detartrage", "dollyxir0", "dollyxir1", "dynamit0", "dynamit1",
  "dynamit2", "grenade0", "grenade1", "grenade2", "jeseleet0",
  "jeseleet1", "mentorhand", "patchinko", "peargrain0", "peargrain1",
  "pistonide", "polarbomb", "protoplop0", "protoplop1", "razkroll",
  "skater", "slide0", "slide1", "tejerkatum", "teleport", "wombat"
]);

var n_objets = liste_objets.length;

/* init données à envoyer
   Cette partie est placée dans une fonction pour être exécuté au
   dernier moment. En effet, la liste est susceptible de changer avant
   l'exportation (par exemple si le joueur consomme une potion de
   vigueur). Cette fonction est appelée juste avant l'exportation pour
   garantir que la liste est à jour à ce moment-là.
*/
function get_inventaire() {
  var inventaire = [];
  for (i = 0; i < n_objets; i++) inventaire[i] = 0;

  // ressort les objets de l'inventaire
  var objects = document.querySelectorAll("#inventory .obj");

  // renseigne l'inventaire pour chaque objet
  Array.forEach(objects, function($obj) {
    // extrait le nom de l'objet
    var $img = $obj.querySelector(".objImg");
    var id = /\/(\w+)\.png$/.exec($img.src)[1];

    // extrait la quantité (alt texte de chaque img)
    var $digits = $obj.querySelectorAll(".objQte img");
    var nb = Array.map($digits, function($img) {
      return $img.alt;
    }).join("");

    var index = liste_objets.indexOf(id);
    if (index > -1) {
      inventaire[index] = parseInt(nb, 10);
    } else {
      alert("Objet inconnu : " + id +
        "\nMerci de rapporter cette erreur à asmodai.");
      // Ici je pense qu'il y a un travail à faire côté serveur pour
      // avoir un système de signalement des erreurs plus fiable.
    }
  });
  
  return inventaire;
}

// Création et ajout de contenu ////////////////////////////////////////

// Crée les nouveaux éléments avec innerHTML car c'est plus lisible pour
// l'œil humain.
var $tempDiv = document.createElement("div");
$tempDiv.innerHTML = "\
<form id='naturaloutil' method='POST' target='_blank' action='#'>\
  <div class='title'>Natural’Outil</div>\
  <p>\
    (<a id='urloutil' href='#' target='_blank'></a>) :\
    <input name='user'   value='' type='hidden' />\
    <input name='hash'   value='' type='hidden' />\
    <input name='bag'    value='' type='hidden' />\
    <input name='id_na2' value='' type='hidden' />\
    <input name='export_bag' value='' type='submit' />\
  </p>\
  <p>\
    <a href='#' id='renew_url' class='linebutton'> Changer l’URL </a>\
    &nbsp;\
    <a href='#' id='renew_creds' class='linebutton'>\
      Changer mes identifiants\
    </a>\
  </p>\
</form>";

// ajoute les styles séparément
GM_addStyle("\
#naturaloutil {\
  text-align: right;\
  font-size: 12px;\
  background: linear-gradient(90deg, #342E29, #29241E 67%, #342E29);\
  border-top: solid 1px #4D4236;\
  border-bottom: solid 1px #4D4236;\
  border-radius: 3px;\
  outline: 1px solid #8F7B65;\
  box-shadow: inset 0 0 0 1px #1A1612;\
  padding: 1px;\
  overflow: hidden;\
  width: 62%;\
  float: right;\
  margin-top: -72px;\
  margin-right: 28px;\
}\
#naturaloutil .title {\
  text-align: left;\
  height: 11px;\
  border: solid 1px #8F7B65;\
  box-shadow: inset 1px 1px 1px -1px black;\
  outline: solid 1px #1A1612;\
  padding: 0 0 0 10px;\
  font-weight: bold;\
  font-size: 10px;\
  line-height: 12px;\
  color: #E6CFB8;\
  background: #675949;\
}");

// Déplace les nouveaux éléments dans un DocumentFragment pour les
// manipuler plus facilement depuis le script.
var fragment = document.createDocumentFragment();
while ($tempDiv.firstElementChild) {
  fragment.appendChild($tempDiv.firstElementChild);
}

var $naturaloutil = fragment.getElementById("naturaloutil");
var $urloutil     = fragment.getElementById("urloutil");
var $user         = fragment.querySelector("input[name='user']");
var $hash         = fragment.querySelector("input[name='hash']");
var $bag          = fragment.querySelector("input[name='bag']");
var $id_na2       = fragment.querySelector("input[name='id_na2']");
var $export_bag   = fragment.querySelector("input[name='export_bag']");
var $renew_url    = fragment.getElementById("renew_url");
var $renew_creds  = fragment.getElementById("renew_creds");

$naturaloutil.action = url_outil + "/import_bag.php";
$naturaloutil.addEventListener("submit", function(submitEvent) {
  $bag.value = get_inventaire();
});

$urloutil.href = url_outil;
$urloutil.textContent = url_outil;
$user.value = joueur;
$hash.value = cle;
$id_na2.value = id_na2;
$export_bag.value = "Exporter (" + joueur + ")";

$renew_url.addEventListener("click", function(event) {
  event.preventDefault();
  renew_url();
});

$renew_creds.addEventListener("click", function(event) {
  event.preventDefault();
  renew_creds();
});

// insertion finale dans le DOM en-dessous de l'inventaire
var $inventory = document.getElementById("inventory");
$inventory.parentNode.insertBefore(fragment, $inventory.nextSibling);

// Mise à jour des informations ////////////////////////////////////////

function renew_creds() {
  var joueur_answer = prompt("Entrez votre login NaturalOutil",
                            joueur || "");
  if (joueur_answer !== null) joueur_answer = joueur_answer.trim();
  if (joueur_answer !== "") {
    joueur = joueur_answer;
    GM_setValue("joueur_" + id_na2, joueur);
    $user.value = joueur;
    $export_bag.value = "Exporter (" + joueur + ")";
  }

  var cle_answer = prompt(
    "Entrez votre clé GreaseMonkey (voir NaturalOutil/compte.php)",
    cle || ""
  );
  if (cle_answer !== null) cle_answer = cle_answer.trim();
  if (cle_answer !== "") {
    cle = cle_answer;
    GM_setValue("cle_GM_" + id_na2, cle);
    $hash.value = cle;
  }
}

function renew_url() {
  var url_answer = prompt("Entrez l’url du NaturalOutil",
                          url_outil || "http://naturaloutil.immae.eu");
  if (url_answer !== null) url_answer = url_answer.trim();
  if (url_answer !== "") {
    url_outil = url_answer;
    GM_setValue("url_naturaloutil", url_outil);
    $naturaloutil.action = url_outil + "/import_bag.php";
    $urloutil.href = url_outil;
    $urloutil.textContent = url_outil;
  }
}

if (!(joueur && cle)) renew_creds();
if (!url_outil) renew_url();
