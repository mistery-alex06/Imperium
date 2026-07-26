# 🏙️ IMPERIUM — Corporate Sabotage

> *Nella sala consiglio non si combatte con le armi. Si combatte con azioni, alleanze e coltelli nella schiena firmati in calce a un contratto.*

Quattro CEO. Un solo impero. E un traditore che nessuno vede arrivare.

**Imperium** è un gioco da tavolo digitale in stile Monopoly con un twist: uno dei quattro amministratori delegati seduti al tavolo non vuole far crescere l'azienda — vuole affondarla dall'interno. Scala il tabellone, acquisisci settori, gioca carte di spionaggio aziendale e, quando la paranoia diventa insostenibile, punta il dito. Ma attenta/o: un'accusa sbagliata costa cara, e il vero Saboteur prospera proprio sul caos che semini.

Nessuna installazione, nessun server, nessun account. Un browser e la fame di potere sono sufficienti.

---

## 🎮 Come si gioca

Apri `index.html` e scegli la modalità:

- **Contro il Computer** — tu sei il CEO 1, gli altri tre poltrone sono occupate da IA che comprano, giocano carte e (a volte) lanciano accuse a caso.
- **Locale (Hotseat)** — quattro persone vere, un solo schermo. A turno, ognuno prende in mano il mouse quando è il proprio momento.

**Il giro base:**
1. Tira il dado e il tuo CEO cammina lungo il tabellone (40 caselle).
2. Atterri su un **Settore** o un **Hub di Trasporto** libero? Puoi acquisirlo. È già di un rivale? Paghi l'affitto — e lui si arricchisce sulle tue spalle.
3. Atterri su una casella d'angolo (**AUDIT**, **BLACK MARKET**, **RAID**)? Il mercato ha un imprevisto per te: un evento casuale che può premiarti o punirti.
4. Hai una carta in mano? Giocala per rubare risorse, congelare un avversario o proteggerti con lo scudo legale.
5. In qualsiasi momento del tuo turno puoi **ACCUSARE** un rivale di essere il Saboteur. Indovina e guadagni potere. Sbagli e paghi il prezzo dell'umiliazione pubblica.
6. Passa il turno da un consiglio all'altro, finché qualcuno non solleva il trofeo — o affonda l'azienda di tutti nel tentativo.

**Chi vince?**
- Un **CEO** vince raggiungendo **50 Potere**, oppure restando l'ultimo non fallito sul mercato.
- Il **Saboteur** vince accumulando **50 punti-sabotaggio** in segreto: ogni accusa sbagliata contro un innocente, ogni attacco riuscito, ogni fallimento altrui — e un'azione di **Sabotaggio** unica e negabile, visibile solo a lui — lo avvicinano alla vittoria senza che nessuno se ne accorga fino alla fine.

Puoi sempre ritirarti da una partita ormai persa: la tua pedina resta sul tabellone, spenta e grigia, mentre gli altri continuano a giocarsi il trono.

La partita si **salva automaticamente** ad ogni azione (in locale, nel browser): se ricarichi la pagina o la chiudi per errore, al rientro ti verrà chiesto se riprenderla da dove l'avevi lasciata o iniziarne una nuova.

---

## 🏢 Distretti e Hub di Trasporto

Il tabellone è diviso in **4 distretti tematici**, riconoscibili dalla striscia colorata sul bordo inferiore di ogni casella:

| Distretto | Zona | Colore |
|---|---|---|
| Distretto Finanziario | Trading Desk 1-9 | Oro |
| Distretto Tech | Server Farm 10-19 | Azzurro |
| Zona Industriale | Linea di Montaggio 20-29 | Ruggine |
| Quartiere Media | Studio 30-39 | Ametista |

Possedere **tutte** le proprietà dello stesso distretto attiva un **monopolio**: +50% di rendita su ciascuna di esse. Gli **Hub di Trasporto** funzionano diversamente: la rendita non dipende dal costo della casella ma da **quanti Hub possiedi in totale** — più ne accumuli, più ognuno rende.

---

## 🃏 Le carte

Mazzo condiviso di **7 carte**: si parte con 2 in mano e se ne pesca una nuova ogni volta che si passa da START (fino a un massimo di 4 in mano contemporaneamente).

| Carta | Tipo | Costo | Effetto |
|---|---|---|---|
| **Espionage** | Attacco | Gratis | Ruba una carta a caso da un avversario |
| **Freeze** | Attacco | 100 | Congela un rivale: niente acquisti per un turno |
| **Poaching** | Attacco | 60 | Sottrae 80 crediti direttamente a un avversario |
| **Legal Team** | Difesa | 50 | Attiva uno scudo che neutralizza il prossimo attacco subito |
| **Insider** | Utility | 200 | Compra un'informazione: chi è davvero il tuo bersaglio? |
| **PR Campaign** | Utility | 80 | Campagna di immagine: +15 reputazione |
| **Cash Injection** | Utility | 120 | Iniezione di liquidità immediata: +150 crediti |

## 🎲 Eventi da sala consiglio

Atterrare su una casella d'angolo pesca uno tra **10 eventi a sorpresa** — dal Boom di mercato alla Fusione Ostile, dallo Sciopero dei Dipendenti all'Endorsement VIP. Il destino della tua trimestrale non è mai del tutto nelle tue mani.

---

## 🗂️ Struttura del progetto

```
index.html              punto di ingresso, carica src/app.js
src/app.js              unica sorgente di verità della logica di gioco
src/styles/
  main.css              identità visiva (palette, layout, tipografia)
  board.css              tabellone, caselle, pedine
  ui.css                 HUD, mano carte, log attività, modali
assets/                 vuota, nessuna risorsa esterna necessaria
```

## 🛠️ Stato attuale

Il gioco è pienamente funzionante: economia, bancarotta, ruoli segreti, eventi, modalità contro IA con euristiche adattive (bersagli strategici, memoria delle informazioni scoperte, priorità di gioco in base allo stato), log delle azioni, identità visiva "dossier esecutivo", un **Sabotaggio** segreto ed esclusivo del Saboteur, e **salvataggio automatico** della partita in corso.

**Prossimi passi** (vedi la cronologia dei commit per i dettagli via via implementati):
- Audio (dadi, acquisti, vittoria).
