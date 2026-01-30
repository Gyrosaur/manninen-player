# MANNINEN PLAYER - CODEX TILANNEKATSAUS

## ONGELMA
Mobile (iPhone Safari) next/prev track ei käynnistä autoplayta. Desktop toimii.

## LIVE SIVU
https://gyrosaur.github.io/manninen-player/

## GITHUB REPO
https://github.com/Gyrosaur/manninen-player

## TIEDOSTOT
- player.js - päälogiikka (tämä tarvitsee korjauksen)
- style.css - tyylit
- index.html - HTML

## MITÄ ON KOKEILTU JA EI TOIMI MOBIILILLA:

### Yritys 1: canplaythrough event
```js
audioPlayer.addEventListener('canplaythrough', () => {
    if (shouldAutoplay) {
        shouldAutoplay = false;
        play();
    }
});
```
TULOS: Ei toimi mobiililla, desktop ok

### Yritys 2: attemptAutoplay() heti loadTrack():ssa + canplay event
```js
if (autoplay) {
    attemptAutoplay();
}
// + canplay listener
```
TULOS: Huononsi - desktop play-nappi näytti pause mutta ääni ei kuulunut

### Yritys 3: pendingPlay lippu + canplay + loadeddata
```js
audioPlayer.addEventListener('canplay', () => {
    if (isMobile && pendingPlay && userHasInteracted) {
        play();
    }
});
audioPlayer.addEventListener('loadeddata', () => {
    if (isMobile && pendingPlay && userHasInteracted) {
        play();
    }
});
```
TULOS: Desktop toimii, mobile EI - next track ei käynnistä soittoa

## NYKYINEN TOIMINTA MOBIILILLA:
1. Käyttäjä painaa play -> toimii
2. Biisi soi loppuun -> seuraava EI ala automaattisesti
3. Käyttäjä painaa next -> biisi vaihtuu, kuva vaihtuu, MUTTA soitto ei ala
4. Käyttäjä painaa pause ja sitten play -> soitto alkaa
5. Swipe vaihtaa biisiä mutta soitto ei jatku

## DESKTOP TOIMII:
- Play/pause ok
- Next/prev autoplay ok
- Biisin loppuessa seuraava alkaa ok

## iOS SAFARI RAJOITUKSET (tiedossa):
- Autoplay vaatii käyttäjän interaktion
- play() pitää kutsua suoraan käyttäjän toiminnon (click/touch) sisällä
- Promise-pohjainen play() voi epäonnistua

## MAHDOLLISIA RATKAISUJA KOKEILTAVAKSI:

1. Kutsu play() SYNKRONISESTI touchend/click handlerissa, ei async
2. Käytä audioPlayer.play() suoraan event handlerissa ilman wrapperia
3. Älä käytä loadTrack() -> play() ketjua, vaan vaihda src ja kutsu play() samassa click handlerissa
4. Kokeile Web Audio API:a HTMLAudioElementin sijaan
5. Preloadaa kaikki audiot etukäteen Audio-objekteina

## KRIITTISTÄ:
- Desktop-toiminnallisuus EI SAA rikkoutua
- Tee erillinen mobiililogiikka jos tarpeen
- isMobile-tunnistus on jo koodissa:
```js
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 'ontouchstart' in window;
```

## TOIVOTTU LOPPUTULOS:
1. Desktop: next/prev/ended -> autoplay (toimii jo)
2. Mobile: next/prev/ended -> autoplay (EI TOIMI)
3. Swipe mobiililla vaihtaa biisiä JA jatkaa soittoa
