// public/script.js
const socket = io();

// Alle UI-Container
const hostLoginContainer = document.getElementById('host-login-container');
const playerJoinContainer = document.getElementById('player-join-container');
const lobbyContainer = document.getElementById('lobby-container');
const quizContainer = document.getElementById('quiz-container');
// ... weitere Elemente

// Buttons und Inputs
const hostLoginBtn = document.getElementById('host-login-btn');
const hostPasswordInput = document.getElementById('host-password-input');
const playerJoinBtn = document.getElementById('player-join-btn');
const playerNameInput = document.getElementById('player-name-input');
const startGameBtn = document.getElementById('start-game-btn');

let isHost = false; // Lokale Variable, um zu wissen, ob dieser Client der Host ist

// === Event Emitter (Aktionen des Benutzers) ===
hostLoginBtn.addEventListener('click', () => {
    socket.emit('hostLogin', hostPasswordInput.value);
});

playerJoinBtn.addEventListener('click', () => {
    socket.emit('playerJoin', playerNameInput.value || 'Anonymer Spieler');
});

startGameBtn.addEventListener('click', () => {
    socket.emit('startGame');
});

// === Event Listener (Nachrichten vom Server) ===

// Zentraler Listener, der die gesamte UI steuert
socket.on('gameStateUpdate', (gameState) => {
    console.log("Neuer Spielzustand:", gameState);
    // Verstecke standardmäßig alles
    [hostLoginContainer, playerJoinContainer, lobbyContainer, quizContainer].forEach(c => c.classList.add('hide'));
    
    // UI basierend auf dem Spielstatus anzeigen
    switch (gameState.status) {
        case 'WAITING_FOR_HOST':
            hostLoginContainer.classList.remove('hide');
            break;
        case 'LOBBY':
            lobbyContainer.classList.remove('hide');
            updatePlayerList(gameState.players);
            if (isHost) {
                startGameBtn.classList.remove('hide');
            } else {
                 // Zeige dem Spieler an, dass er in der Lobby ist und wartet
                 // Prüfe, ob der Spieler schon beigetreten ist
                const selfInGame = gameState.players.some(p => p.id === socket.id);
                if (!selfInGame) {
                    playerJoinContainer.classList.remove('hide');
                }
            }
            break;
        case 'IN_GAME':
            quizContainer.classList.remove('hide');
            break;
        // ... weitere Zustände
    }
});

// Wenn der Host-Login erfolgreich war
socket.on('hostSuccess', () => {
    isHost = true;
    alert("Du bist jetzt der Host!");
    // Verstecke das Host-Login-Formular für diesen Client
    hostLoginContainer.classList.add('hide');
});

// Bei Fehlern
socket.on('error', (message) => {
    alert(`Fehler: ${message}`);
});

// Hilfsfunktion zur Anzeige der Spielerliste
function updatePlayerList(players) {
    const playerList = document.getElementById('player-list');
    playerList.innerHTML = ''; // Liste leeren
    players.forEach(player => {
        const li = document.createElement('li');
        li.textContent = `${player.name} - ${player.score} Punkte`;
        playerList.appendChild(li);
    });
}