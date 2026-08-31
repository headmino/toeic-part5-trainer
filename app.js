(function () {
    "use strict";

    var TIMER_SECONDS = 20;
    var STORAGE_KEY = "toeic-part5-trainer-stats";
    var choiceLabels = ["A", "B", "C", "D"];

    var questions = shuffle(window.TOEIC_PART5_QUESTIONS.slice());
    var currentIndex = 0;
    var sessionCorrect = 0;
    var answered = false;
    var timeLeft = TIMER_SECONDS;
    var timerId = null;
    var questionStartedAt = Date.now();

    var progressText = document.getElementById("progressText");
    var sessionScoreText = document.getElementById("sessionScoreText");
    var timeLeftText = document.getElementById("timeLeftText");
    var timerFill = document.getElementById("timerFill");
    var grammarPointText = document.getElementById("grammarPointText");
    var difficultyText = document.getElementById("difficultyText");
    var sentenceText = document.getElementById("sentenceText");
    var choicesContainer = document.getElementById("choicesContainer");
    var resultPanel = document.getElementById("resultPanel");
    var resultTitle = document.getElementById("resultTitle");
    var answerLine = document.getElementById("answerLine");
    var explanationText = document.getElementById("explanationText");
    var nextButton = document.getElementById("nextButton");
    var restartButton = document.getElementById("restartButton");
    var resetStatsButton = document.getElementById("resetStatsButton");
    var totalSolvedText = document.getElementById("totalSolvedText");
    var accuracyText = document.getElementById("accuracyText");
    var timeoutText = document.getElementById("timeoutText");
    var averageTimeText = document.getElementById("averageTimeText");

    nextButton.addEventListener("click", goToNextQuestion);
    restartButton.addEventListener("click", restartSession);
    resetStatsButton.addEventListener("click", resetStats);
    document.addEventListener("keydown", handleKeyboardChoice);

    renderStats();
    renderQuestion();

    function renderQuestion() {
        var question = questions[currentIndex];
        answered = false;
        timeLeft = TIMER_SECONDS;
        questionStartedAt = Date.now();

        progressText.textContent = (currentIndex + 1) + " / " + questions.length;
        sessionScoreText.textContent = String(sessionCorrect);
        timeLeftText.textContent = String(timeLeft);
        timerFill.style.width = "100%";
        grammarPointText.textContent = question.grammarPoint;
        difficultyText.textContent = question.difficulty;
        sentenceText.textContent = question.sentence;

        resultPanel.className = "result-panel hidden";
        resultTitle.textContent = "";
        answerLine.textContent = "";
        explanationText.textContent = "";
        nextButton.disabled = true;
        nextButton.textContent = currentIndex === questions.length - 1 ? "결과 보기" : "다음 문제";

        choicesContainer.innerHTML = "";
        question.choices.forEach(function (choice, index) {
            var button = document.createElement("button");
            button.className = "choice-button";
            button.type = "button";
            button.dataset.index = String(index);
            button.innerHTML = "<span class=\"choice-key\">" + choiceLabels[index] + "</span><span class=\"choice-text\">" + choice + "</span>";
            button.addEventListener("click", function () {
                submitAnswer(index, false);
            });
            choicesContainer.appendChild(button);
        });

        startTimer();
    }

    function startTimer() {
        clearInterval(timerId);
        timerId = setInterval(function () {
            timeLeft -= 1;
            timeLeftText.textContent = String(Math.max(timeLeft, 0));
            timerFill.style.width = (Math.max(timeLeft, 0) / TIMER_SECONDS * 100) + "%";

            if (timeLeft <= 0) {
                submitAnswer(null, true);
            }
        }, 1000);
    }

    function submitAnswer(selectedIndex, isTimeout) {
        if (answered) {
            return;
        }

        var question = questions[currentIndex];
        var isCorrect = selectedIndex === question.answerIndex && !isTimeout;
        var elapsedMs = isTimeout ? TIMER_SECONDS * 1000 : Date.now() - questionStartedAt;

        answered = true;
        clearInterval(timerId);
        timeLeftText.textContent = isTimeout ? "0" : timeLeftText.textContent;
        timerFill.style.width = isTimeout ? "0%" : timerFill.style.width;
        nextButton.disabled = false;

        if (isCorrect) {
            sessionCorrect += 1;
            sessionScoreText.textContent = String(sessionCorrect);
        }

        updateChoiceStyles(selectedIndex, question.answerIndex);
        showResult(question, selectedIndex, isCorrect, isTimeout);
        saveAttempt(isCorrect, isTimeout, elapsedMs);
        renderStats();
    }

    function updateChoiceStyles(selectedIndex, answerIndex) {
        Array.prototype.forEach.call(choicesContainer.children, function (button, index) {
            button.disabled = true;
            if (index === answerIndex) {
                button.classList.add("correct");
            }
            if (selectedIndex === index && selectedIndex !== answerIndex) {
                button.classList.add("wrong");
            }
        });
    }

    function showResult(question, selectedIndex, isCorrect, isTimeout) {
        var answerLabel = choiceLabels[question.answerIndex];
        var answerText = question.choices[question.answerIndex];
        var selectedLabel = selectedIndex === null ? "시간초과" : choiceLabels[selectedIndex];

        resultPanel.className = "result-panel " + (isCorrect ? "correct-result" : "wrong-result");
        resultTitle.textContent = isCorrect ? "정답입니다" : (isTimeout ? "20초 초과로 오답 처리되었습니다" : "오답입니다");
        answerLine.textContent = "정답: " + answerLabel + ". " + answerText + " / 선택: " + selectedLabel;
        explanationText.textContent = question.explanation;
    }

    function goToNextQuestion() {
        if (!answered) {
            return;
        }

        if (currentIndex >= questions.length - 1) {
            showSessionComplete();
            return;
        }

        currentIndex += 1;
        renderQuestion();
    }

    function showSessionComplete() {
        clearInterval(timerId);
        answered = true;
        nextButton.disabled = true;
        nextButton.textContent = "완료";
        timeLeftText.textContent = "0";
        timerFill.style.width = "0%";
        grammarPointText.textContent = "세션 완료";
        difficultyText.textContent = "복습 권장";
        sentenceText.textContent = "오늘 세션이 끝났습니다. 틀린 문법 포인트를 확인한 뒤 처음부터 다시 풀어보세요.";
        choicesContainer.innerHTML = "";
        resultPanel.className = "result-panel correct-result";
        resultTitle.textContent = "세션 점수: " + sessionCorrect + " / " + questions.length;
        answerLine.textContent = "정답률 " + Math.round(sessionCorrect / questions.length * 100) + "%";
        explanationText.textContent = "Part 5는 짧은 시간 안에 품사, 수일치, 접속사, 전치사 단서를 찾는 훈련이 중요합니다.";
    }

    function restartSession() {
        clearInterval(timerId);
        questions = shuffle(window.TOEIC_PART5_QUESTIONS.slice());
        currentIndex = 0;
        sessionCorrect = 0;
        renderQuestion();
    }

    function handleKeyboardChoice(event) {
        var key = event.key.toUpperCase();
        var index = choiceLabels.indexOf(key);
        if (index >= 0 && !answered) {
            submitAnswer(index, false);
        }
    }

    function getStats() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || createEmptyStats();
        } catch (error) {
            return createEmptyStats();
        }
    }

    function createEmptyStats() {
        return {
            attempted: 0,
            correct: 0,
            timedOut: 0,
            totalTimeMs: 0
        };
    }

    function saveAttempt(isCorrect, isTimeout, elapsedMs) {
        var stats = getStats();
        stats.attempted += 1;
        stats.correct += isCorrect ? 1 : 0;
        stats.timedOut += isTimeout ? 1 : 0;
        stats.totalTimeMs += Math.min(elapsedMs, TIMER_SECONDS * 1000);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }

    function renderStats() {
        var stats = getStats();
        var accuracy = stats.attempted === 0 ? 0 : Math.round(stats.correct / stats.attempted * 100);
        var averageSeconds = stats.attempted === 0 ? 0 : stats.totalTimeMs / stats.attempted / 1000;

        totalSolvedText.textContent = String(stats.attempted);
        accuracyText.textContent = accuracy + "%";
        timeoutText.textContent = String(stats.timedOut);
        averageTimeText.textContent = averageSeconds.toFixed(1) + "초";
    }

    function resetStats() {
        localStorage.removeItem(STORAGE_KEY);
        renderStats();
    }

    function shuffle(items) {
        for (var index = items.length - 1; index > 0; index -= 1) {
            var randomIndex = Math.floor(Math.random() * (index + 1));
            var temp = items[index];
            items[index] = items[randomIndex];
            items[randomIndex] = temp;
        }
        return items;
    }
}());
