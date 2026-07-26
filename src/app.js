/* IMPERIUM - Single Script Version for File Protocol Compatibility
   Unica sorgente di verità del gioco (nessun altro file JS da mantenere in parallelo). */

const START_BONUS = 200;
const MAX_HAND_SIZE = 4; // NUOVO: limite carte in mano, per evitare accumuli infiniti con la ricarica

/* --- Board --- */
class Board {
    constructor() {
        this.tiles = [];
        this.size = 40;
    }

    generateBoard() {
        for (let i = 0; i < 40; i++) {
            let type = 'property';
            let name = `Sector ${i}`;
            let cost = 100 + (i * 10);

            if (i % 5 === 0) {
                type = 'railroad';
                name = `Transport Hub ${i / 5}`;
            }
            if (i === 0) { type = 'corner'; name = 'START'; }
            else if (i === 10) { type = 'corner'; name = 'AUDIT'; }
            else if (i === 20) { type = 'corner'; name = 'BLACK MARKET'; }
            else if (i === 30) { type = 'corner'; name = 'RAID'; }

            // FIX: le caselle angolo non sono acquistabili, quindi non devono avere un costo (evitava
            // che l'UI mostrasse un prezzo fittizio su START/AUDIT/BLACK MARKET/RAID).
            if (type === 'corner') cost = null;

            this.tiles.push({
                index: i,
                type: type,
                name: name,
                cost: cost,
                owner: null
            });
        }
    }
}

/* --- Player --- */
class Player {
    constructor(id, name, color) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.credits = 1500;
        this.reputation = 50;
        this.power = 0;
        this.position = 0;
        this.hand = [];
        this.isSaboteur = false;

        // FIX: stato di bancarotta reale (prima assente: i crediti potevano andare negativi
        // senza alcuna conseguenza e il giocatore continuava a giocare all'infinito).
        this.isBankrupt = false;
        // FIX: effetto reale della carta "Freeze" (prima era solo un -100 crediti fisso).
        this.frozenTurns = 0;
        // FIX: effetto reale della carta "Legal Team" (prima definita ma mai gestita).
        this.hasShield = false;
        // NUOVO: punti-sabotaggio, rilevanti solo per il Saboteur. Non mostrati in HUD
        // (altrimenti rivelerebbero il ruolo segreto).
        this.sabotagePoints = 0;
        // NUOVO: ritiro volontario dalla partita (distinto dalla bancarotta).
        this.isRetired = false;
        // NUOVO: turni di attesa prima di poter usare di nuovo il Sabotaggio (solo Saboteur).
        this.sabotageCooldown = 0;
    }

    /**
     * Muove il giocatore di N passi.
     * FIX: restituisce true se si è passati/atterrati su START, per assegnare il bonus
     * di passaggio (prima assente: nessun bonus per il giro completato).
     */
    move(steps) {
        const prevPosition = this.position;
        this.position = (this.position + steps) % 40;
        const passedStart = (prevPosition + steps) >= 40;
        return passedStart;
    }
}

/* --- Cards --- */
class Cards {
    constructor() {
        this.specialDeck = [];
        this.initDecks();
    }

    initDecks() {
        this.initEventDeck();
        // FIX: ogni carta ha ora un "cost" realmente scalato al giocatore che la gioca
        // (prima il campo esisteva solo nei dati, mai applicato: le carte erano gratis).
        // FIX: reintrodotta "Legal Team" (s3), presente solo nella versione modulare e mai gestita.
        // NUOVO: mazzo espanso da 4 a 7 carte, condiviso (si pesca più volte durante la
        // partita, non più una carta fissa a testa) per più varietà e profondità strategica.
        this.specialDeck = [
            { id: 's1', type: 'attack', title: 'Espionage', cost: 0, desc: "Ruba una carta a caso da un avversario." },
            { id: 's2', type: 'attack', title: 'Freeze', cost: 100, desc: "L'avversario non può comprare proprietà per 1 turno." },
            { id: 's3', type: 'defense', title: 'Legal Team', cost: 50, desc: "Blocca il prossimo attacco subito." },
            { id: 's4', type: 'utility', title: 'Insider', cost: 200, desc: "Rivela il ruolo di un avversario." },
            { id: 's5', type: 'attack', title: 'Poaching', cost: 60, desc: "Sottrae 80 crediti direttamente a un avversario." },
            { id: 's6', type: 'utility', title: 'PR Campaign', cost: 80, desc: "Campagna di immagine: +15 reputazione." },
            { id: 's7', type: 'utility', title: 'Cash Injection', cost: 120, desc: "Iniezione di liquidità immediata: +150 crediti." }
        ];
    }

    drawSpecial() {
        const idx = Math.floor(Math.random() * this.specialDeck.length);
        return this.specialDeck[idx];
    }

    initEventDeck() {
        // NUOVO: mazzo eventi ora collegato alle caselle angolo (AUDIT/BLACK MARKET/RAID).
        // Espanso da 4 a 10 carte per ridurre la ripetitività (5 eventi favorevoli, 5 avversi).
        this.eventDeck = [
            { id: 'e1', title: 'Boom', desc: 'Il mercato esplode: +150 crediti.', apply: (p) => { p.credits += 150; } },
            { id: 'e2', title: 'Cyber Attack', desc: 'Un attacco informatico ti costa 100 crediti.', apply: (p) => { p.credits = Math.max(0, p.credits - 100); } },
            { id: 'e3', title: 'Audit', desc: "Un'ispezione fiscale: -15 reputazione, -50 crediti.", apply: (p) => { p.reputation = Math.max(0, p.reputation - 15); p.credits = Math.max(0, p.credits - 50); } },
            { id: 'e4', title: 'PR Stunt', desc: 'Ottima copertura mediatica: +10 reputazione, +5 potere.', apply: (p) => { p.reputation += 10; p.power += 5; } },
            { id: 'e5', title: 'Fusione Ostile', desc: 'Un fondo rivale investe su di te: +250 crediti, -10 reputazione.', apply: (p) => { p.credits += 250; p.reputation = Math.max(0, p.reputation - 10); } },
            { id: 'e6', title: 'Sciopero dei Dipendenti', desc: 'La produttività crolla: -80 crediti, -5 potere.', apply: (p) => { p.credits = Math.max(0, p.credits - 80); p.power = Math.max(0, p.power - 5); } },
            { id: 'e7', title: 'Class Action', desc: "Una causa collettiva ti costa cara: -120 crediti, -10 reputazione.", apply: (p) => { p.credits = Math.max(0, p.credits - 120); p.reputation = Math.max(0, p.reputation - 10); } },
            { id: 'e8', title: 'Rimborso Fiscale', desc: 'Un cavillo gioca a tuo favore: +100 crediti.', apply: (p) => { p.credits += 100; } },
            { id: 'e9', title: 'Fuga di Dati', desc: 'Una violazione informatica scuote la fiducia: -20 reputazione.', apply: (p) => { p.reputation = Math.max(0, p.reputation - 20); } },
            { id: 'e10', title: 'Endorsement VIP', desc: 'Una celebrità elogia la tua azienda: +15 reputazione, +10 potere.', apply: (p) => { p.reputation += 15; p.power += 10; } }
        ];
    }

    drawEvent() {
        const idx = Math.floor(Math.random() * this.eventDeck.length);
        return this.eventDeck[idx];
    }
}

/* --- UI --- */
class UI {
    constructor(game) {
        this.game = game;
        this.boardElement = document.getElementById('game-board');
        this.hudContainer = document.getElementById('players-hud-container');
    }

    renderBoard(tiles) {
        this.boardElement.innerHTML = '<div id="board-center"><div class="brand-mark">Imperium</div><div class="brand-sub">Confidenziale • Clearance Tier-1</div></div>';

        tiles.forEach(tile => {
            const el = document.createElement('div');
            el.className = `tile ${tile.type}`;
            el.dataset.index = tile.index;
            // FIX: il costo viene mostrato solo se esiste (le caselle angolo non lo hanno più).
            const costLine = tile.cost != null ? `${tile.cost}$` : '';
            el.innerHTML = `
                <div class="tile-header"></div>
                <div class="tile-name">${tile.name}</div>
                <div class="tile-cost">${costLine}</div>
            `;
            const pos = this.getGridPosition(tile.index);
            el.style.gridColumn = pos.col;
            el.style.gridRow = pos.row;
            this.boardElement.appendChild(el);
        });
    }

    getGridPosition(index) {
        let row, col;
        if (index === 0) { row = 11; col = 11; }
        else if (index >= 1 && index <= 9) { row = 11; col = 11 - index; }
        else if (index === 10) { row = 11; col = 1; }
        else if (index >= 11 && index <= 19) { row = 11 - (index - 10); col = 1; }
        else if (index === 20) { row = 1; col = 1; }
        else if (index >= 21 && index <= 29) { row = 1; col = 1 + (index - 20); }
        else if (index === 30) { row = 1; col = 11; }
        else { row = 1 + (index - 30); col = 11; }
        return { row, col };
    }

    updatePlayerPosition(player) {
        let token = document.getElementById(`player-token-${player.id}`);
        if (!token) {
            token = document.createElement('div');
            token.id = `player-token-${player.id}`;
            token.className = 'player-token';
            token.style.backgroundColor = player.color;
            // FIX: il token viene appeso direttamente al tabellone (non alla singola casella)
            // e posizionato in pixel assoluti, così da poter animare lo spostamento in modo
            // fluido invece di "teletrasportarsi" da un contenitore all'altro.
            this.boardElement.appendChild(token);
        }
        this.placeTokenOnTile(token, player, player.position, false);
        return token;
    }

    /**
     * Calcola la posizione in pixel della casella `tileIndex` rispetto al tabellone e vi
     * posiziona il token, con un piccolo scarto per giocatore (così più pedine sulla stessa
     * casella restano tutte visibili invece di sovrapporsi esattamente).
     */
    placeTokenOnTile(token, player, tileIndex, animate) {
        const tileEl = this.boardElement.querySelector(`.tile[data-index="${tileIndex}"]`);
        if (!tileEl) return;
        const boardRect = this.boardElement.getBoundingClientRect();
        const tileRect = tileEl.getBoundingClientRect();
        const offsetX = (player.id % 2 === 0 ? -1 : 1) * Math.max(0, tileRect.width / 2 - 12);
        const offsetY = (player.id < 2 ? -1 : 1) * Math.max(0, tileRect.height / 2 - 12);
        const left = (tileRect.left - boardRect.left) + tileRect.width / 2 + offsetX - 8.5;
        const top = (tileRect.top - boardRect.top) + tileRect.height / 2 + offsetY - 8.5;

        if (!animate) token.style.transition = 'none';
        token.style.left = `${left}px`;
        token.style.top = `${top}px`;
        if (!animate) {
            void token.offsetWidth; // forza il reflow prima di riattivare la transizione
            token.style.transition = '';
        }
    }

    /**
     * Anima il movimento del pedone casella per casella (invece di un salto diretto
     * all'ultima casella), con un piccolo "balzo" per ogni passo.
     * Restituisce una Promise risolta al termine dell'ultimo passo.
     */
    animateTokenMovement(player, startPos, steps) {
        const token = document.getElementById(`player-token-${player.id}`);
        return new Promise((resolve) => {
            if (!token || steps <= 0) { resolve(); return; }
            const hopDuration = 220;
            let i = 0;
            const hop = () => {
                i++;
                const tileIndex = (startPos + i) % 40;
                token.classList.add('moving');
                this.placeTokenOnTile(token, player, tileIndex, true);
                setTimeout(() => {
                    token.classList.remove('moving');
                    if (i < steps) {
                        hop();
                    } else {
                        resolve();
                    }
                }, hopDuration);
            };
            hop();
        });
    }

    updateHUD(currentPlayer, allPlayers) {
        this.hudContainer.innerHTML = '';
        allPlayers.forEach(p => {
            const card = document.createElement('div');
            card.className = `player-card ${p.id === currentPlayer.id ? 'active-turn' : ''} ${p.isBankrupt ? 'bankrupt' : ''} ${p.isRetired ? 'retired' : ''}`;

            // FIX BUG CRITICO: rimosso "p.isSaboteur && p.id === 0" che rivelava pubblicamente
            // nell'HUD il ruolo segreto del Saboteur ogni volta che coincideva col giocatore 0.
            // Badge non-segreti (scudo/congelamento) restano, perché non compromettono il ruolo nascosto.
            const tags = `${p.hasShield ? ' <span title="Scudo attivo">🛡</span>' : ''}${p.frozenTurns > 0 ? ' <span title="Congelato: niente acquisti">🧊</span>' : ''}`;
            const roleTag = this.game.mode === 'computer'
                ? (p.id === this.game.humanPlayerId ? ' <span class="badge-role">TU</span>' : ' <span class="badge-role">IA</span>')
                : '';

            card.innerHTML = `
                <div class="badge-top">
                    <div class="badge-avatar" style="background:${p.color}">${p.id + 1}</div>
                    <div>
                        <div class="badge-name" style="color:${p.color}">${p.name}${roleTag}</div>
                        <div class="badge-tags">${tags}</div>
                    </div>
                </div>
                <div class="stat-row"><span>Crediti</span> <span>${p.credits}</span></div>
                <div class="stat-row"><span>Potere</span> <span>${p.power}</span></div>
                <div class="stat-row"><span>Reputazione</span> <span>${p.reputation}</span></div>
            `;
            this.hudContainer.appendChild(card);
        });

        const handContainer = document.getElementById('hand-container');
        if (handContainer) {
            handContainer.innerHTML = '';
            // FIX: durante il turno dell'IA le carte non devono essere cliccabili dall'utente.
            const interactive = !(this.game.mode === 'computer' && currentPlayer.id !== this.game.humanPlayerId);
            currentPlayer.hand.forEach((card, index) => {
                const cEl = document.createElement('div');
                cEl.className = 'game-card';
                const costLabel = card.cost > 0 ? `${card.cost}$` : 'GRATIS';
                cEl.innerHTML = `
                    <div class="card-body">
                        <div class="card-title">${card.title}</div>
                        <div class="card-cost">${costLabel}</div>
                        <div class="card-desc">${card.desc}</div>
                    </div>
                `;
                if (interactive) {
                    cEl.onclick = () => this.game.handleCardPlay(card, index);
                } else {
                    cEl.style.opacity = '0.45';
                    cEl.style.cursor = 'default';
                }
                handContainer.appendChild(cEl);
            });
        }

        this.ensureAccuseButton();
        this.ensureSabotageButton();
    }

    /**
     * Pulsante "SABOTAGGIO": esiste nel DOM SOLO durante il turno del Saboteur, e viene
     * rimosso del tutto (non solo disabilitato) negli altri turni — così in hotseat locale
     * nessun altro giocatore può vederlo comparire e dedurre chi è il traditore.
     */
    ensureSabotageButton() {
        const current = this.game.currentPlayer;
        const isCurrentHumanTurn = !(this.game.mode === 'computer' && current.id !== this.game.humanPlayerId);
        const shouldExist = current.isSaboteur && isCurrentHumanTurn;
        let btn = document.getElementById('btn-sabotage');

        if (!shouldExist) {
            if (btn) btn.remove();
            return;
        }

        if (!btn) {
            const actions = document.getElementById('actions-container');
            if (!actions) return;
            btn = document.createElement('button');
            btn.id = 'btn-sabotage';
            btn.className = 'action-btn sabotage';
            btn.onclick = () => this.game.handleSabotageClick();
            const endBtn = document.getElementById('btn-end-turn');
            if (endBtn) actions.insertBefore(btn, endBtn); else actions.appendChild(btn);
        }

        const ready = current.sabotageCooldown <= 0;
        btn.disabled = !ready;
        btn.innerText = ready ? 'SABOTAGGIO' : `SABOTAGGIO (${current.sabotageCooldown})`;
    }

    ensureAccuseButton() {
        let accuseBtn = document.getElementById('btn-accuse');
        if (!accuseBtn) {
            const actions = document.getElementById('actions-container');
            if (!actions) return;
            accuseBtn = document.createElement('button');
            accuseBtn.id = 'btn-accuse';
            accuseBtn.className = 'action-btn';
            accuseBtn.innerText = 'ACCUSE';
            accuseBtn.style.borderColor = 'var(--color-danger)';
            accuseBtn.style.color = 'var(--color-danger)';
            // Decisione di design: l'accusa è un'azione strategica disponibile in ogni momento
            // del proprio turno, indipendente dal tiro di dado (non richiede isProcessingTurn).
            accuseBtn.disabled = false;

            accuseBtn.onclick = () => {
                if (this.game) this.game.handleAccusationAttempt();
            };

            const endBtn = document.getElementById('btn-end-turn');
            if (endBtn) {
                actions.insertBefore(accuseBtn, endBtn);
            } else {
                actions.appendChild(accuseBtn);
            }
        }
    }

    setTurnIndicator(player, round) {
        const nameEl = document.getElementById('current-player-name');
        const roundEl = document.getElementById('round-count');
        if (nameEl) {
            const isAI = this.game.mode === 'computer' && player.id !== this.game.humanPlayerId;
            nameEl.innerText = player.name + (isAI ? ' (IA in azione…)' : '');
            nameEl.style.color = player.color;
        }
        if (roundEl) roundEl.innerText = round;
    }

    toggleButton(id, state) {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = !state;
    }

    showDiceResult(roll) {
        this.log(`Tiro: ${roll}`, this.game.currentPlayer);
        const el = document.createElement('div');
        el.innerText = roll;
        el.style.position = 'fixed';
        el.style.top = '50%';
        el.style.left = '50%';
        el.style.transform = 'translate(-50%, -50%)';
        el.style.fontSize = '5rem';
        el.style.color = '#fff';
        el.style.zIndex = '200';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }

    log(msg, player = null) {
        console.log(`[GAME] ${msg}`);
        const logEl = document.getElementById('action-log');
        if (!logEl) return;
        const entry = document.createElement('div');
        entry.className = `log-entry ${player ? '' : 'log-system'}`;
        if (player) {
            entry.style.borderLeftColor = player.color;
            entry.innerHTML = `<span class="log-player" style="color:${player.color}">${player.name}</span> — ${msg}`;
        } else {
            entry.textContent = msg;
        }
        logEl.appendChild(entry);
        // Limite entries per non appesantire il DOM in partite lunghe
        while (logEl.children.length > 60) logEl.removeChild(logEl.firstChild);
    }

    showModal(title, body, actions = []) {
        const overlay = document.getElementById('modal-overlay');
        const mTitle = document.getElementById('modal-title');
        const mBody = document.getElementById('modal-body');
        const mActions = document.getElementById('modal-actions');
        if (!overlay) return;

        mTitle.innerText = title;
        mBody.innerText = body;
        mActions.innerHTML = '';

        actions.forEach(act => {
            const btn = document.createElement('button');
            btn.className = 'action-btn';
            btn.innerText = act.text;
            btn.onclick = () => {
                overlay.classList.add('hidden');
                act.action();
            };
            mActions.appendChild(btn);
        });

        overlay.classList.remove('hidden');
    }

    updateTileVisual(tile, color) {
        const el = this.boardElement.querySelector(`.tile[data-index="${tile.index}"]`);
        if (el) {
            // Il possesso si vede dal bordo; il box-shadow resta libero per il bagliore
            // dei CEO che sostano sulla casella (vedi refreshTileGlow).
            el.style.border = `2px solid ${color}`;
        }
    }

    /**
     * Illumina la casella `tileIndex` con il colore di ogni CEO attualmente presente
     * (1 giocatore = 1 colore, 2 giocatori = 2 colori, ecc.), ricalcolando in base
     * alla posizione reale dei giocatori.
     */
    refreshTileGlow(tileIndex) {
        const el = this.boardElement.querySelector(`.tile[data-index="${tileIndex}"]`);
        if (!el) return;
        const occupants = this.game.players.filter(p => p.position === tileIndex && !p.isBankrupt && !p.isRetired);

        if (occupants.length === 0) {
            el.style.boxShadow = '';
            el.classList.remove('occupied');
            return;
        }

        el.classList.add('occupied');
        // Ogni giocatore illumina un lato diverso della casella, così con più CEO presenti
        // si vedono più colori distinti invece di un unico bagliore mescolato.
        const offsets = [
            { x: 0, y: -3 },
            { x: 3, y: 0 },
            { x: 0, y: 3 },
            { x: -3, y: 0 }
        ];
        const shadows = occupants.map((p, i) => {
            const o = offsets[i % offsets.length];
            return `${o.x}px ${o.y}px 9px 1px ${p.color}`;
        });
        el.style.boxShadow = shadows.join(', ');
    }

    /** Colora la pedina di grigio per un CEO che si è ritirato dalla partita. */
    setTokenGray(player) {
        const token = document.getElementById(`player-token-${player.id}`);
        if (token) token.style.backgroundColor = '#5b5f6b';
    }
}

/* --- Game --- */
class Game {
    constructor() {
        this.board = new Board();
        this.cards = new Cards();
        this.players = [];
        this.currentPlayerIndex = 0;
        this.ui = new UI(this);
        this.round = 1;
        this.isProcessingTurn = false; // true = "ho già tirato il dado in questo turno"
        // NUOVO: modalità di gioco ("computer" = tu sei CEO 1, gli altri 3 sono IA;
        // "locale" = hotseat, tutti e 4 i CEO sono persone reali). Scelta a inizio partita.
        this.mode = null;
        this.humanPlayerId = 0;
        // NUOVO: evita di far ripartire il giro turni dopo che la partita è già finita
        // (es. un ritiro può concludere la partita).
        this.gameOver = false;
        this.init();
    }

    init() {
        console.log("IMPERIUM: Initializing...");
        this.board.generateBoard();
        this.ui.renderBoard(this.board.tiles);

        const colors = ['#C1443B', '#4C8FBD', '#8B6FC9', '#D6B24C']; // Rubino, Zaffiro, Ametista, Topazio
        for (let i = 0; i < 4; i++) {
            this.players.push(new Player(i, `CEO ${i + 1}`, colors[i]));
            // NUOVO: 2 carte iniziali invece di 1, dal mazzo condiviso.
            this.players[i].hand.push(this.cards.drawSpecial());
            this.players[i].hand.push(this.cards.drawSpecial());
        }

        const saboteurIndex = Math.floor(Math.random() * 4);
        this.players[saboteurIndex].isSaboteur = true;
        console.log(`Debug: Player ${saboteurIndex} is the Saboteur.`);

        this.players.forEach(p => this.ui.updatePlayerPosition(p));
        this.ui.refreshTileGlow(0); // tutti i CEO partono da START
        this.ui.updateHUD(this.currentPlayer, this.players);

        this.ui.log("Partita iniziata. Un Saboteur si nasconde tra i 4 CEO.");

        const rollBtn = document.getElementById('btn-roll');
        const endBtn = document.getElementById('btn-end-turn');
        const surrenderBtn = document.getElementById('btn-surrender');

        if (rollBtn) rollBtn.onclick = () => this.handleRollDice();
        if (endBtn) endBtn.onclick = () => this.endTurn();
        if (surrenderBtn) surrenderBtn.onclick = () => this.handleSurrenderClick();

        // NUOVO: prima di iniziare, si sceglie la modalità di gioco.
        this.showModeSelectionModal();
    }

    showModeSelectionModal() {
        this.ui.showModal(
            "Seleziona Modalità",
            "Contro il Computer: sei il CEO 1, gli altri 3 sono IA. Locale: tutti e 4 i CEO sono giocatori umani allo stesso schermo.",
            [
                { text: "Contro il Computer", action: () => this.setMode('computer') },
                { text: "Locale (Hotseat)", action: () => this.setMode('locale') }
            ]
        );
    }

    setMode(mode) {
        this.mode = mode;
        this.ui.log(mode === 'computer'
            ? "Modalità: contro il Computer. Sei il CEO 1, gli altri sono IA."
            : "Modalità: Locale. Tutti e 4 i CEO sono giocatori umani.");
        this.startTurn();
    }

    isAITurn() {
        return this.mode === 'computer' && this.currentPlayer.id !== this.humanPlayerId;
    }

    /**
     * Mostra un popup solo se il turno è di un umano; durante i turni dell'IA esegue
     * direttamente la prima azione (di solito "OK"/continua) così il turno scorre da solo
     * senza richiedere click all'utente, mantenendo comunque traccia nel log.
     */
    showModalUnlessAI(title, body, actions) {
        if (this.isAITurn()) {
            if (actions[0]) actions[0].action();
        } else {
            this.ui.showModal(title, body, actions);
        }
    }

    get currentPlayer() { return this.players[this.currentPlayerIndex]; }

    startTurn() {
        this.isProcessingTurn = false;
        // NUOVO: il cooldown del Sabotaggio scende solo nei turni di chi lo possiede.
        if (this.currentPlayer.sabotageCooldown > 0) this.currentPlayer.sabotageCooldown--;
        this.ui.updateHUD(this.currentPlayer, this.players);
        this.ui.setTurnIndicator(this.currentPlayer, this.round);
        const isHuman = !this.isAITurn();
        this.ui.toggleButton('btn-roll', isHuman);
        this.ui.toggleButton('btn-end-turn', false);
        this.ui.toggleButton('btn-surrender', isHuman);
        const accuseBtn = document.getElementById('btn-accuse');
        if (accuseBtn) accuseBtn.disabled = !isHuman;
        this.ui.log(`Inizio turno.`, this.currentPlayer);

        if (!isHuman) {
            // NUOVO: turno dell'IA, gioca da sola dopo una breve pausa "di riflessione".
            setTimeout(() => this.handleRollDice(), 700);
        }
    }

    handleRollDice() {
        if (this.isProcessingTurn) return;
        this.isProcessingTurn = true;
        this.ui.toggleButton('btn-roll', false);
        this.ui.toggleButton('btn-surrender', false);

        const roll = Math.floor(Math.random() * 6) + 1;
        this.ui.showDiceResult(roll);

        setTimeout(() => {
            const startPos = this.currentPlayer.position;
            const passedStart = this.currentPlayer.move(roll);
            // FIX: bonus per il passaggio/atterraggio su START (prima assente).
            if (passedStart) {
                this.currentPlayer.credits += START_BONUS;
                this.ui.log(`Passa da START: +${START_BONUS} crediti.`, this.currentPlayer);
                // NUOVO: il mazzo carte è condiviso e si ricarica — tornare a START fa pescare
                // una nuova carta (fino al limite massimo in mano).
                if (this.currentPlayer.hand.length < MAX_HAND_SIZE) {
                    this.currentPlayer.hand.push(this.cards.drawSpecial());
                    this.ui.log(`Riceve una nuova carta da HQ.`, this.currentPlayer);
                }
            }
            // FIX: il pedone ora "cammina" casella per casella invece di teletrasportarsi
            // direttamente sulla casella finale.
            this.ui.animateTokenMovement(this.currentPlayer, startPos, roll).then(() => {
                // FIX: la casella di partenza si spegne, quella di arrivo si illumina del
                // colore del CEO (o dei CEO, se più di uno vi sosta sopra).
                this.ui.refreshTileGlow(startPos);
                this.ui.refreshTileGlow(this.currentPlayer.position);
                this.handleTileInteraction();
            });
        }, 1000);
    }

    handleTileInteraction() {
        const tile = this.board.tiles[this.currentPlayer.position];
        this.ui.log(`Atterra su ${tile.name}.`, this.currentPlayer);

        if (tile.type === 'property' || tile.type === 'railroad') {
            // FIX: effetto reale della carta Freeze. Se il giocatore è congelato, salta
            // automaticamente l'acquisto (prima "Freeze" non faceva nulla di simile).
            if (this.currentPlayer.frozenTurns > 0 && tile.owner === null) {
                this.currentPlayer.frozenTurns -= 1;
                this.ui.log(`È congelato: non può comprare questo turno.`, this.currentPlayer);
                this.finishActionPhase();
                return;
            }

            if (tile.owner === null) {
                if (this.currentPlayer.credits >= tile.cost) {
                    if (this.isAITurn()) {
                        // NUOVO: l'IA decide da sola se comprare (euristica: mantiene una riserva minima)
                        if (this.currentPlayer.credits - tile.cost >= 150) {
                            this.buyProperty(tile);
                        } else {
                            this.ui.log(`Decide di non comprare ${tile.name}.`, this.currentPlayer);
                            this.finishActionPhase();
                        }
                        return;
                    }
                    this.ui.showModal("Acquisition", `Buy ${tile.name} for ${tile.cost}?`, [
                        { text: "Buy", action: () => this.buyProperty(tile) },
                        { text: "Pass", action: () => this.finishActionPhase() }
                    ]);
                    return;
                }
            } else if (tile.owner !== this.currentPlayer.id) {
                this.payRent(tile);
                return;
            } else {
                this.finishActionPhase();
                return;
            }
        }
        // NUOVO: caselle angolo (tranne START) pescano ora un evento reale.
        if (tile.type === 'corner' && tile.index !== 0) {
            const event = this.cards.drawEvent();
            event.apply(this.currentPlayer);
            this.ui.log(`Evento "${event.title}": ${event.desc}`, this.currentPlayer);
            this.showModalUnlessAI(`Evento: ${event.title}`, event.desc, [{ text: "OK", action: () => { } }]);
            this.checkWinConditions();
            this.finishActionPhase();
            return;
        }

        this.finishActionPhase();
    }

    buyProperty(tile) {
        this.currentPlayer.credits -= tile.cost;
        tile.owner = this.currentPlayer.id;
        this.ui.log(`Acquista ${tile.name} per ${tile.cost}.`, this.currentPlayer);
        this.ui.updateTileVisual(tile, this.currentPlayer.color);
        this.finishActionPhase();
    }

    payRent(tile) {
        const owner = this.players[tile.owner];
        const rent = Math.floor(tile.cost * 0.1);

        // FIX: gestione reale della bancarotta (prima i crediti potevano andare negativi
        // senza alcuna conseguenza per il giocatore).
        if (this.currentPlayer.credits < rent) {
            owner.credits += this.currentPlayer.credits; // paga quello che ha
            this.currentPlayer.credits = 0;
            this.currentPlayer.isBankrupt = true;
            this.ui.log(`È FALLITO ed eliminato dalla partita.`, this.currentPlayer);
            // NUOVO: un giocatore fallito non illumina più le caselle.
            this.ui.refreshTileGlow(tile.index);
            // NUOVO: il fallimento di un CEO avvantaggia il Saboteur (a meno che non sia lui stesso).
            const saboteur = this.getSaboteur();
            if (saboteur && !this.currentPlayer.isSaboteur) {
                saboteur.sabotagePoints += 25;
            }
        } else {
            this.currentPlayer.credits -= rent;
            owner.credits += rent;
            this.ui.log(`Paga ${rent} di affitto a ${owner.name}.`, this.currentPlayer);
        }

        this.checkWinConditions();
        this.finishActionPhase();
    }

    finishActionPhase() {
        this.ui.updateHUD(this.currentPlayer, this.players);
        this.ui.toggleButton('btn-end-turn', true);

        if (this.isAITurn()) {
            // NUOVO: dopo l'azione sulla casella, l'IA valuta se sabotare in segreto (se è
            // il Saboteur), giocare una carta e/o accusare qualcuno, poi passa il turno da sola.
            setTimeout(() => {
                this.aiMaybeSabotage();
                this.aiMaybePlayCard();
                this.aiMaybeAccuse();
                setTimeout(() => this.endTurn(), 500);
            }, 500);
        }
    }

    /**
     * Azione unica e segreta del Saboteur: colpisce un avversario a caso, ma il registro
     * attività riporta l'accaduto come un evento di mercato anonimo (nessuna attribuzione
     * al giocatore), così l'azione resta negabile e non tradisce il ruolo.
     */
    handleSabotageClick() {
        if (!this.currentPlayer.isSaboteur || this.currentPlayer.sabotageCooldown > 0 || this.gameOver) return;
        const targets = this.players.filter(p => p.id !== this.currentPlayer.id && !p.isBankrupt && !p.isRetired);
        if (targets.length === 0) return;

        const target = targets[Math.floor(Math.random() * targets.length)];
        const amount = 50 + Math.floor(Math.random() * 100);
        target.credits = Math.max(0, target.credits - amount);

        this.currentPlayer.sabotagePoints += 20;
        this.currentPlayer.sabotageCooldown = 3;

        // Log volutamente anonimo (nessun player passato): non deve rivelare l'autore.
        this.ui.log(`Contraccolpo di mercato imprevisto: ${target.name} perde ${amount} crediti.`);

        this.ui.updateHUD(this.currentPlayer, this.players);
        this.checkWinConditions();
    }

    aiMaybeSabotage() {
        if (!this.currentPlayer.isSaboteur || this.currentPlayer.sabotageCooldown > 0) return;
        // L'IA-Saboteur usa il Sabotaggio quasi sempre appena disponibile: è la sua unica vera arma.
        if (Math.random() < 0.7) {
            this.handleSabotageClick();
        }
    }

    aiMaybePlayCard() {
        if (this.currentPlayer.isBankrupt || this.currentPlayer.hand.length === 0) return;
        // NUOVO: con più carte in mano, l'IA valuta quelle che può permettersi invece di
        // guardare solo la prima.
        const affordable = this.currentPlayer.hand
            .map((card, index) => ({ card, index }))
            .filter(({ card }) => this.currentPlayer.credits >= card.cost);
        if (affordable.length === 0) return;
        // Euristica semplice: gioca una carta a caso tra quelle permesse, circa metà delle volte.
        if (Math.random() < 0.5) {
            const choice = affordable[Math.floor(Math.random() * affordable.length)];
            this.executeCardEffect(choice.card, choice.index);
        }
    }

    aiMaybeAccuse() {
        if (this.currentPlayer.isBankrupt) return;
        // Euristica semplice: piccola probabilità di accusare qualcuno a caso ogni turno.
        if (Math.random() < 0.15) {
            const others = this.players.filter(p => p.id !== this.currentPlayer.id && !p.isBankrupt && !p.isRetired);
            if (others.length === 0) return;
            const target = others[Math.floor(Math.random() * others.length)];
            this.ui.log(`Lancia un'accusa…`, this.currentPlayer);
            this.processAccusation(target);
        }
    }

    handleCardPlay(card, index) {
        if (!this.isProcessingTurn) {
            this.ui.log("Devi prima tirare il dado!", this.currentPlayer);
            return;
        }
        // FIX: gating su fondi insufficienti (prima le carte erano giocabili gratis a prescindere).
        if (this.currentPlayer.credits < card.cost) {
            this.ui.showModal("Fondi insufficienti", `Ti servono ${card.cost} crediti per giocare ${card.title}.`, [{ text: "OK", action: () => { } }]);
            return;
        }
        this.ui.showModal("Play Card", `Use ${card.title} (${card.cost}$)?`, [
            { text: "Confirm", action: () => this.executeCardEffect(card, index) },
            { text: "Cancel", action: () => { } }
        ]);
    }

    executeCardEffect(card, index) {
        this.currentPlayer.hand.splice(index, 1);
        // FIX: il costo della carta viene ora davvero scalato a chi la gioca.
        this.currentPlayer.credits -= card.cost;

        if (card.id === 's3') {
            // Legal Team: attiva uno scudo che blocca il prossimo attacco subito.
            this.currentPlayer.hasShield = true;
            this.ui.log(`Attiva uno scudo legale (Legal Team).`, this.currentPlayer);
        } else if (card.type === 'attack') {
            const target = this.players.find(p => p.id !== this.currentPlayer.id && !p.isBankrupt && !p.isRetired);
            if (!target) {
                this.ui.log("Nessun bersaglio disponibile.", this.currentPlayer);
            } else if (target.hasShield) {
                // FIX: lo scudo (Legal Team) ora blocca realmente un attacco in arrivo.
                target.hasShield = false;
                this.ui.log(`Ha bloccato un attacco con lo scudo legale!`, target);
                this.showModalUnlessAI("Attacco Bloccato", `${target.name} ha usato il suo scudo legale!`, [{ text: "OK", action: () => { } }]);
            } else if (card.id === 's1') {
                // FIX: furto realmente casuale (prima prendeva sempre l'ultima carta, mai a caso).
                if (target.hand.length > 0) {
                    const stolenIndex = Math.floor(Math.random() * target.hand.length);
                    const [stolen] = target.hand.splice(stolenIndex, 1);
                    this.currentPlayer.hand.push(stolen);
                    this.ui.log(`Ruba una carta a ${target.name} (Espionage).`, this.currentPlayer);
                } else {
                    this.ui.log(`${target.name} non ha carte da rubare.`, this.currentPlayer);
                }
            } else if (card.id === 's2') {
                // FIX: effetto reale "congelamento acquisti" invece del vecchio -100 crediti fisso.
                target.frozenTurns += 1;
                this.ui.log(`Congela ${target.name} per il prossimo turno (Freeze).`, this.currentPlayer);
            } else if (card.id === 's5') {
                // NUOVO: Poaching — sottrae crediti direttamente, senza coinvolgere le carte.
                const stolenAmount = Math.min(80, target.credits);
                target.credits -= stolenAmount;
                this.currentPlayer.credits += stolenAmount;
                this.ui.log(`Sottrae ${stolenAmount} crediti a ${target.name} (Poaching).`, this.currentPlayer);
            }
            // NUOVO: se è stato il Saboteur ad attaccare con successo, guadagna punti-sabotaggio.
            if (this.currentPlayer.isSaboteur) {
                this.currentPlayer.sabotagePoints += 10;
            }
        } else if (card.type === 'utility') {
            if (card.id === 's4') {
                const target = this.players.find(p => p.id !== this.currentPlayer.id && !p.isRetired);
                if (target) {
                    const role = target.isSaboteur ? "SABOTEUR" : "CEO";
                    this.ui.log(`Consulta un informatore su ${target.name} (Insider).`, this.currentPlayer);
                    this.showModalUnlessAI("Insider Info", `${target.name} is: ${role}`, [{ text: "OK", action: () => { } }]);
                }
            } else if (card.id === 's6') {
                // NUOVO: PR Campaign — investimento in reputazione.
                this.currentPlayer.reputation += 15;
                this.ui.log(`Lancia una campagna di immagine: +15 reputazione (PR Campaign).`, this.currentPlayer);
            } else if (card.id === 's7') {
                // NUOVO: Cash Injection — liquidità immediata.
                this.currentPlayer.credits += 150;
                this.ui.log(`Ottiene un'iniezione di liquidità: +150 crediti (Cash Injection).`, this.currentPlayer);
            }
        }
        this.checkWinConditions();
        this.ui.updateHUD(this.currentPlayer, this.players);
    }

    handleAccusationAttempt() {
        this.ui.log(`Lancia un'accusa…`, this.currentPlayer);
        const others = this.players.filter(p => p.id !== this.currentPlayer.id && !p.isBankrupt && !p.isRetired);
        const actions = others.map(p => ({
            text: `Accuse ${p.name}`,
            action: () => this.processAccusation(p)
        }));
        actions.push({ text: "Cancel", action: () => { } });
        this.ui.showModal("Make an Accusation", "Risky Move!", actions);
    }

    getSaboteur() {
        return this.players.find(p => p.isSaboteur);
    }

    handleSurrenderClick() {
        if (this.isProcessingTurn || this.gameOver) return;
        const player = this.currentPlayer;
        this.ui.showModal(
            "Ritirarsi dalla partita?",
            `${player.name} vuole ritirarsi. La decisione è definitiva: la pedina resterà sul tabellone (grigia) ma non giocherai più. Gli altri CEO continueranno a giocarsi la vittoria. Confermi?`,
            [
                { text: "Conferma Ritiro", action: () => this.retirePlayer(player) },
                { text: "Annulla", action: () => { } }
            ]
        );
    }

    retirePlayer(player) {
        player.isRetired = true;
        this.ui.log(`Si ritira dalla partita.`, player);
        this.ui.setTokenGray(player);
        this.ui.refreshTileGlow(player.position);
        this.ui.updateHUD(this.currentPlayer, this.players);
        this.checkWinConditions();
        // Se la partita non è già finita (es. era l'ultimo CEO attivo), si passa il turno
        // per lasciare che i restanti si giochino la vittoria.
        if (!this.gameOver) this.endTurn();
    }

    processAccusation(target) {
        if (target.isSaboteur) {
            this.ui.log(`Accusa ${target.name}: ESATTO, era il Saboteur! +20 Potere.`, this.currentPlayer);
            this.showModalUnlessAI("SUCCESS", `${target.name} was the Saboteur! You gain Power.`, [{ text: "OK", action: () => { } }]);
            target.credits = Math.floor(target.credits / 2);
            this.currentPlayer.power += 20;
        } else {
            this.ui.log(`Accusa ${target.name}: SBAGLIATO, era innocente.`, this.currentPlayer);
            this.showModalUnlessAI("FAILED", `${target.name} is Innocent! You lose resources.`, [{ text: "OK", action: () => { } }]);
            this.currentPlayer.credits = Math.floor(this.currentPlayer.credits / 2);
            // NUOVO: un'accusa sbagliata semina confusione e avvantaggia il vero Saboteur.
            const saboteur = this.getSaboteur();
            if (saboteur) saboteur.sabotagePoints += 15;
        }
        this.checkWinConditions();
        this.ui.updateHUD(this.currentPlayer, this.players);
    }

    checkWinConditions() {
        const winner = this.players.find(p => p.power >= 50);
        if (winner) {
            this.gameOver = true;
            this.ui.showModal("GAME OVER", `${winner.name} wins by Power!`, [{ text: "Reload", action: () => location.reload() }]);
            return;
        }

        // NUOVO: condizione di vittoria propria del Saboteur, simmetrica alla soglia di Potere.
        // Deve essere ancora in partita (non fallito né ritirato) per poter vincere.
        const saboteur = this.getSaboteur();
        if (saboteur && !saboteur.isBankrupt && !saboteur.isRetired && saboteur.sabotagePoints >= 50) {
            this.gameOver = true;
            this.ui.showModal("GAME OVER", `${saboteur.name} era il Saboteur e ha sabotato con successo l'azienda!`, [{ text: "Reload", action: () => location.reload() }]);
            return;
        }

        // FIX: reintrodotta la vittoria per bancarotta altrui (era stata persa nel bundle).
        // NUOVO: esclude anche i CEO ritirati volontariamente dal conteggio dei "rimasti in gioco".
        const active = this.players.filter(p => !p.isBankrupt && !p.isRetired);
        if (active.length === 1) {
            this.gameOver = true;
            this.ui.showModal("GAME OVER", `${active[0].name} is the last CEO standing!`, [{ text: "Reload", action: () => location.reload() }]);
        }
    }

    endTurn() {
        // FIX: usa players.length invece di "% 4" hardcoded, e salta i giocatori falliti
        // o ritirati (prima un fallito restava comunque nel giro dei turni).
        const total = this.players.length;
        let next = this.currentPlayerIndex;
        for (let i = 0; i < total; i++) {
            next = (next + 1) % total;
            if (!this.players[next].isBankrupt && !this.players[next].isRetired) break;
        }
        if (next <= this.currentPlayerIndex) this.round++;
        this.currentPlayerIndex = next;
        this.startTurn();
    }
}

/* --- Init --- */
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
