// Fragen für das Quiz als Array von Objekten
const questions = [
    {
        question: "Was ist die Hauptstadt von Deutschland?",
        answers: [
            { text: "München", correct: false },
            { text: "Berlin", correct: true },
            { text: "Hamburg", correct: false },
            { text: "Köln", correct: false }
        ]
    },
    {
        question: "Welcher Planet ist als der 'Rote Planet' bekannt?",
        answers: [
            { text: "Venus", correct: false },
            { text: "Jupiter", correct: false },
            { text: "Mars", correct: true },
            { text: "Saturn", correct: false }
        ]
    },
    {
        question: "Wie viele Beine hat eine Spinne?",
        answers: [
            { text: "6", correct: false },
            { text: "8", correct: true },
            { text: "10", correct: false },
            { text: "4", correct: false }
        ]
    },
    {
        question: "Woraus besteht HTML?",
        answers: [
            { text: "Programmiersprache", correct: false },
            { text: "Skriptsprache", correct: false },
            { text: "Datenbank", correct: false },
            { text: "Auszeichnungssprache", correct: true }
        ]
    }
];

// HTML-Elemente holen
const startContainer = document.getElementById('start-container');
const quizContainer = document.getElementById('quiz-container');
const resultContainer = document.getElementById('result-container');
const startButton = document.getElementById('start-btn');
const questionElement = document.getElementById('question');
const answerButtonsElement = document.getElementById('answer-buttons');
const nextButton = document.getElementById('next-btn');
const restartButton = document.getElementById('restart-btn');
const scoreElement = document.getElementById('score');
const totalQuestionsElement = document.getElementById('total-questions');

let currentQuestionIndex, score;

// Event Listener für die Buttons
startButton.addEventListener('click', startQuiz);
nextButton.addEventListener('click', setNextQuestion);
restartButton.addEventListener('click', startQuiz);

// Funktion, um das Quiz zu starten
function startQuiz() {
    startContainer.classList.add('hide');
    resultContainer.classList.add('hide');
    quizContainer.classList.remove('hide');
    
    currentQuestionIndex = 0;
    score = 0;
    
    setNextQuestion();
}

// Funktion, um die nächste Frage zu laden
function setNextQuestion() {
    resetState();
    if (currentQuestionIndex < questions.length) {
        showQuestion(questions[currentQuestionIndex]);
    } else {
        showResult();
    }
}

// Funktion, um eine Frage und die Antworten anzuzeigen
function showQuestion(question) {
    questionElement.innerText = question.question;
    question.answers.forEach(answer => {
        const button = document.createElement('button');
        button.innerText = answer.text;
        button.classList.add('btn');
        if (answer.correct) {
            button.dataset.correct = answer.correct;
        }
        button.addEventListener('click', selectAnswer);
        answerButtonsElement.appendChild(button);
    });
}

// Funktion, um den Zustand zurückzusetzen (Buttons entfernen, etc.)
function resetState() {
    nextButton.classList.add('hide');
    while (answerButtonsElement.firstChild) {
        answerButtonsElement.removeChild(answerButtonsElement.firstChild);
    }
}

// Funktion, die bei der Auswahl einer Antwort ausgeführt wird
function selectAnswer(e) {
    const selectedButton = e.target;
    const correct = selectedButton.dataset.correct === "true";
    
    if (correct) {
        score++;
    }

    // Visuelles Feedback für alle Buttons
    Array.from(answerButtonsElement.children).forEach(button => {
        setStatusClass(button, button.dataset.correct === "true");
        button.disabled = true; // Buttons deaktivieren nach der Auswahl
    });

    currentQuestionIndex++;
    nextButton.classList.remove('hide');
}

// Funktion, um CSS-Klassen für richtig/falsch zu setzen
function setStatusClass(element, correct) {
    if (correct) {
        element.classList.add('correct');
    } else {
        element.classList.add('wrong');
    }
}

// Funktion, um das Endergebnis anzuzeigen
function showResult() {
    quizContainer.classList.add('hide');
    resultContainer.classList.remove('hide');
    scoreElement.innerText = score;
    totalQuestionsElement.innerText = questions.length;
}