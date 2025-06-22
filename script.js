// ==============
//  CLIENT-SIDE SCRIPT
// ==============

const socket = io();

// === GLOBALE VARIABLEN ===
let isHost = false; // Wichtige Variable, um zu wissen, ob dieser Client der Host ist
let localGameState = {}; // Lokale Kopie des Spielzustands

// === UI ELEMENTE ===
// Container
const hostLoginContainer = document.getElementById('host-login-container');
const playerJoinContainer = document.getElementById('player-join-container');
const lobbyContainer = document.getElementById('lobby-container');
const quizContainer = document.getElementById('quiz-container');
const resultContainer = document.getElementById('result-container');
const allContainers = [hostLoginContainer, playerJoinContainer, lobbyContainer, quizContainer, resultContainer];

// Buttons und Inputs
const hostLoginBtn = document.getElementById('host-login-btn');
const hostPasswordInput = document.getElementById('host-password-input');
const playerJoinBtn = document.getElementById('player-join-btn');
const playerNameInput = document.getElementById('player-name-input');
const startGameBtn = document.getElementById('start-game-btn');

// Quiz-spezifische Elemente
const questionElement = document.getElementById('question');
const answerButtonsElement = document.getElementById('answer-buttons');
const playerListElement = document.getElementById('player-list');
const lobbyInfoText = document.getElementById('lobby-info-text');

// === EVENT EMITTER (Aktionen vom Client an den Server) ===

hostLoginBtn.addEventListener('click', () => {
    socket.emit('hostLogin', hostPasswordInput.value);
});

playerJoinBtn.addEventListener('click', () => {
    const playerName = playerNameInput.value.trim();
    if (playerName) {
        socket.emit('playerJoin', playerName);
    } else {
        alert("Bitte gib einen Namen ein.");
    }
});

startGameBtn.addEventListener('click', () => {
    socket.emit('startGame');
});


// === EVENT LISTENER (Nachrichten vom Server an den Client) ===

// Wenn der Host-Login erfolgreich war
socket.on('hostSuccess', () => {
    console.log("Host-Login erfolgreich bestätigt vom Server.");
    isHost = true;
});

// Zentraler Listener, der die gesamte UI basierend auf dem Spielzustand steuert
socket.on('gameStateUpdate', (gameState) => {
    console.log("Neuer Spielzustand erhalten:", gameState.status);
    localGameState = gameState; // Speichere den Zustand lokal

    // Verstecke standardmäßig alle Haupt-Container
    allContainers.forEach(c => c.classList.add('hide'));

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
                playerJoinContainer.classList.add('hide');
                lobbyInfoText.textContent = "Du bist der Host. Klicke 'Spiel starten', sobald alle bereit sind.";
            } else {
                const selfInGame = gameState.players.some(p => p.id === socket.id);
                if (selfInGame) {
                    lobbyInfoText.textContent = "Du bist im Spiel! Warte, bis der Host startet...";
                    playerJoinContainer.classList.add('hide');
                } else {
                    playerJoinContainer.classList.remove('hide');
                }
            }
            break;

        case 'IN_GAME':
            quizContainer.classList.remove('hide');
            break;
            
        case 'FINISHED':
            resultContainer.classList.remove('hide');
            // Hier Ergebnislogik einfügen
            break;
    }
});

// Wenn eine neue Frage vom Server kommt
socket.on('newQuestion', (questionData) => {
    console.log("Neue Frage erhalten:", questionData.question);
    questionElement.innerText = questionData.question;
    
    // Alte Antwort-Buttons entfernen
    answerButtonsElement.innerHTML = '';

    // Neue Antwort-Buttons erstellen
    questionData.answers.forEach(answer => {
        const button = document.createElement('button');
        button.innerText = answer.text;
        button.classList.add('btn');
        // Speichere, ob die Antwort korrekt ist (wichtig für die Auswertung)
        if (answer.correct) {
            button.dataset.correct = "true";
        }
        // button.addEventListener('click', selectAnswer); // Diese Funktion müssen wir noch implementieren
        answerButtonsElement.appendChild(button);
    });
});

// Bei Fehlern
socket.on('error', (message) => {
    alert(`Fehler: ${message}`);
});


// === HILFSFUNKTIONEN ===

// Funktion zur Anzeige der Spielerliste
function updatePlayerList(players) {
    playerListElement.innerHTML = ''; // Liste leeren
    players.forEach(player => {
        const li = document.createElement('li');
        let playerLabel = `${player.name} - ${player.score} Punkte`;
        if (player.id === localGameState.hostId) {
            playerLabel += " (Host)";
        }
        li.textContent = playerLabel;
        playerListElement.appendChild(li);
    });
}