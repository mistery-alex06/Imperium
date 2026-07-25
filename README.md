# IMPERIUM: Corporate Sabotage

Gioco da tavolo digitale in stile Monopoly, con un ruolo segreto stile "traditore" (Saboteur), per 4 giocatori sullo stesso browser (hot-seat, nessun server).

## Requisiti
- Nessuna installazione, nessun server, nessuna dipendenza esterna.
- Basta aprire `index.html` in un browser moderno (funziona anche via `file://`).

## Come si gioca
1. **4 CEO** partono da `START` con 1500 crediti, 50 reputazione, 0 potere.
2. A ogni turno: **Tira il dado** → il pedone si sposta sul tabellone (40 caselle). Passare/atterrare su START dà un bonus di **+200 crediti**.
3. **Casella Sector/Transport Hub**: se libera, puoi comprarla (genera affitto); se di un avversario, paghi affitto (10% del costo casella); se tua, non succede nulla.
4. **Caselle angolo** (START, AUDIT, BLACK MARKET, RAID): non acquistabili, nessun prezzo mostrato.
5. **Carte**: ogni giocatore riceve una carta speciale casuale a inizio partita; si gioca dopo il tiro di dado, cliccando la carta in mano. Ogni carta ha un **costo in crediti** scalato a chi la gioca.
6. **ACCUSA**: in ogni momento del tuo turno puoi accusare un avversario di essere il Saboteur. Se indovini: gli dimezzi i crediti e guadagni 20 Potere. Se sbagli: ti dimezzi i crediti tu.
7. **Fine turno**: passa al giocatore solvente successivo; un giro completo incrementa il round.

## Ruoli e condizioni di vittoria
- **CEO** (3 su 4): vince chi raggiunge **50 Potere**, oppure se resta l'unico giocatore non fallito.
- **Saboteur** (1 su 4, assegnato a caso e nascosto): ha una condizione di vittoria propria e indipendente. Accumula **punti-sabotaggio** (invisibili nell'HUD, per non tradire il ruolo) quando:
  - un avversario lo accusa per errore (+15, va al vero Saboteur anche se non è il giocatore corrente);
  - un suo attacco (Espionage/Freeze) va a segno senza essere bloccato da uno scudo (+10);
  - un CEO fallisce (+25, salvo sia il fallito stesso).
  
  Al raggiungimento di **50 punti-sabotaggio vince**, in modo simmetrico alla soglia di Potere dei CEO.
- **Bancarotta**: se non riesci a pagare un affitto, vieni eliminato dal giro turni; l'ultimo giocatore solvente vince.
- **Eventi**: atterrando su AUDIT, BLACK MARKET o RAID (non su START) peschi una carta evento casuale (Boom, Cyber Attack, Audit, PR Stunt) che modifica crediti/reputazione/potere.

## Carte disponibili
| Carta | Tipo | Costo | Effetto |
|---|---|---|---|
| Espionage | attacco | 0 | Ruba una carta casuale a un avversario (bloccato da scudo) |
| Freeze | attacco | 100 | L'avversario non può comprare proprietà per il turno successivo (bloccato da scudo) |
| Legal Team | difesa | 50 | Attiva uno scudo che neutralizza il prossimo attacco subito |
| Insider | utility | 200 | Rivela se un avversario è il Saboteur |

## Struttura del progetto
```
index.html              punto di ingresso, carica src/app.js
src/app.js              UNICA sorgente di verità della logica di gioco
src/styles/
  main.css              variabili tema (colori neon/cyberpunk, font Orbitron/Rajdhani)
  board.css              layout a griglia del tabellone (11x11)
  ui.css                 HUD giocatori, mano carte, modali, stato bancarotta
assets/                 vuota, nessuna risorsa (immagini/suoni) presente
```

> Nota: la vecchia cartella `src/modules/` (versione a moduli ES, mai caricata da `index.html` e già divergente dal codice reale) è stata rimossa dal progetto e spostata in `Documents/imperium-modules-DEPRECATED-backup` come archivio. Se in futuro si vuole una vera modularizzazione, va introdotto uno step di build (es. concatenazione o bundler) invece di mantenere due sorgenti a mano.

## Changelog fix (audit e implementazione mazzo eventi/vittoria Saboteur)
- 🔒 **Fix critico**: rimosso un leak che rivelava pubblicamente nell'HUD il ruolo segreto del Saboteur.
- 💰 Costo delle carte ora realmente scalato dai crediti di chi le gioca (prima erano gratis).
- 🎯 "Espionage" ora ruba davvero una carta casuale (prima rubava sempre l'ultima).
- 🧊 "Freeze" implementa davvero il blocco acquisti per un turno (prima era un generico -100 crediti).
- 🛡️ Reintrodotta "Legal Team": scudo che blocca un attacco in arrivo.
- 🏦 Bancarotta reale: eliminazione dal giro turni + vittoria per ultimo solvente.
- 🎲 Bonus di +200 crediti per passaggio/atterraggio su START.
- 🧹 Le caselle angolo non mostrano più un costo fittizio.
- 🔁 `endTurn()` non più hardcoded su 4 giocatori, e salta i giocatori falliti.
- 🗂️ Rimossa la doppia sorgente di codice (`src/modules/` vs `src/app.js`): ora esiste un solo file di logica.

## Limiti noti / roadmap
- Nessun salvataggio/persistenza: ricaricando la pagina la partita riparte da zero.
- Il Saboteur non ha ancora carte/azioni dedicate per generare punti-sabotaggio in modo attivo (per ora sono conseguenza indiretta di accuse sbagliate, attacchi riusciti e fallimenti altrui).
