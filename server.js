// ==============
//  DEPENDENCIES
// ==============
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs'); // Das 'File System'-Modul zum Lesen von Dateien

// ==============
//  INITIAL SETUP
// ==============
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// ==============
//  KONFIGURATION
// ==============
// Das geheime Passwort, um sich als Host anzumelden.
// ÄNDERE DIES AUF EIN EIGENES PASSWORT!
const HOST_PASSWORD = "meinSuperGeheimesPasswort123";

// Lade die Fragen aus der externen JSON-Datei
let allQuestions = [];
try {
    const questionsData = fs.readFileSync('questions.json', 'utf8');
    allQuestions = JSON.parse(questionsData);
    console.log(`Erfolgreich ${allQuestions.length} Fragen aus questions.json geladen.`);
} catch (error) {
    console.error("FEHLER: Die Datei 'questions.json' konnte nicht geladen werden.", error);
    process.exit(1); // Beendet den Server, wenn die Fragen nicht geladen werden können.
}


// ==============
//  HILFSFUNKTIONEN
// ==============
// Funktion, um die Elemente eines Arrays zufällig zu mischen (Fisher-Yates-Algorithmus)
function shuffleArray(array) {
    const newArr = [...array]; // Erstellt eine Kopie, um das Original nicht zu verändern
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}


// ==============
//  GLOBALER SPIELZUSTAND
// ==============
// Dieses eine Objekt steuert das gesamte Spiel.
let gameState = {
    status: 'WAITING_FOR_HOST', // Mögliche Zustände: WAITING_FOR_HOST, LOBBY, IN_GAME, FINISHED
    hostId: null,
    players: [], // Ein Array von Spieler-Objekten: { id: socket.id, name: 'Spielername', score: 0 }
    currentQuestionIndex: -1,
    questions: shuffleArray(allQuestions) // Wir starten direkt mit einem gemischten Set von Fragen
};


// ==============
//  SERVER LOGIK
// ==============
// Statische Dateien aus dem 'public'-Ordner bereitstellen (index.html, style.css, script.js)
app.use(express.static('public'));

// Diese Funktion wird jedes Mal ausgeführt, wenn ein neuer Benutzer die Webseite öffnet.
io.on('connection', (socket) => {
    console.log('Ein neuer Benutzer hat sich verbunden:', socket.id);

    // Sende dem neuen Benutzer sofort den aktuellen Spielzustand, damit er weiß, was los ist.
    socket.emit('gameStateUpdate', gameState);

    // --- EVENT LISTENER FÜR AKTIONEN VOM CLIENT ---

    // Ein Benutzer versucht, sich als Host anzumelden
    socket.on('hostLogin', (password) => {
        if (gameState.hostId) {
            return socket.emit('error', 'Es gibt bereits einen Host für dieses Spiel.');
        }
        if (password === HOST_PASSWORD) {
            gameState.hostId = socket.id;
            gameState.status = 'LOBBY';
            gameState.players.push({ id: socket.id, name: 'Host', score: 0 });

            socket.emit('hostSuccess'); // Sende Bestätigung nur an den neuen Host
            io.emit('gameStateUpdate', gameState); // Sende den neuen Zustand an ALLE (inkl. Host)

            console.log(`Host hat sich erfolgreich angemeldet: ${socket.id}`);
        } else {
            socket.emit('error', 'Falsches Host-Passwort.');
        }
    });

    // Ein Spieler möchte dem Spiel beitreten
    socket.on('playerJoin', (playerName) => {
        if (gameState.status !== 'LOBBY') {
            return socket.emit('error', 'Du kannst dem Spiel gerade nicht beitreten.');
        }
        if (gameState.players.some(p => p.id === socket.id)) {
            return socket.emit('error', 'Du bist bereits im Spiel.');
        }
        gameState.players.push({ id: socket.id, name: playerName || `Spieler_${socket.id.substr(0, 4)}`, score: 0 });
        io.emit('gameStateUpdate', gameState); // Update an alle senden
    });

    // Der Host startet das Spiel
    socket.on('startGame', () => {
        if (socket.id !== gameState.hostId) return; // Sicherheitsprüfung

        gameState.status = 'IN_GAME';
        gameState.currentQuestionIndex = 0;
        
        io.emit('gameStateUpdate', gameState);

        // Frage für den Client umwandeln und senden
        const currentQuestionData = gameState.questions[gameState.currentQuestionIndex];
        const questionForClient = {
            question: currentQuestionData.question,
            answers: currentQuestionData.options.map((option, index) => ({
                text: option,
                correct: index === currentQuestionData.correctIndex
            }))
        };
        io.emit('newQuestion', questionForClient);
    });

    // HIER WÜRDE DIE LOGIK FÜR 'submitAnswer' UND 'nextQuestion' HINKOMMEN

    // Ein Benutzer schließt das Browserfenster oder verliert die Verbindung
    socket.on('disconnect', () => {
        console.log('Ein Benutzer hat die Verbindung getrennt:', socket.id);

        const isHost = socket.id === gameState.hostId;
        
        // Entferne den Spieler/Host aus der Spielerliste
        gameState.players = gameState.players.filter(p => p.id !== socket.id);

        if (isHost) {
            console.log("Der Host hat das Spiel verlassen. Das Spiel wird zurückgesetzt.");
            // Spiel komplett zurücksetzen und Fragen neu mischen
            gameState = {
                status: 'WAITING_FOR_HOST',
                hostId: null,
                players: [],
                currentQuestionIndex: -1,
                questions: shuffleArray(allQuestions)
            };
        }
        // Sende immer ein Update, egal wer gegangen ist
        io.emit('gameStateUpdate', gameState);
    });
});

// ==============
//  SERVER START
// ==============
server.listen(PORT, () => {
    console.log(`Server läuft und lauscht auf http://localhost:${PORT}`);
});