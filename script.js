(() => {
  // Page containers
  const landingPage = document.getElementById('landing-page');
  const speedTesterPage = document.getElementById('speedtester-page');
  const goToTesterBtn = document.getElementById('go-to-tester');

  // Header dark mode toggle
  const darkToggleBtn = document.getElementById('dark-toggle');
  const darkIcon = document.getElementById('dark-icon');

  // Elements on speedtester page
  const testTextElement = document.getElementById('test-text');
  const hiddenInput = document.getElementById('hidden-input');
  const startBtn = document.getElementById('start-btn');
  const resetBtn = document.getElementById('reset-btn');
  const timeLeftEl = document.getElementById('time-left');
  const wpmEl = document.getElementById('wpm');
  const accuracyEl = document.getElementById('accuracy');
  const errorsEl = document.getElementById('errors');
  const cpsEl = document.getElementById('cps');
  const wordsCountEl = document.getElementById('words-count');
  const progressBar = document.getElementById('progress-bar');
  const durationSelect = document.getElementById('duration-select');

  // Final modal elements
  const finalModal = document.getElementById('final-modal');
  const finalWPM = document.getElementById('final-wpm');
  const finalAccuracy = document.getElementById('final-accuracy');
  const finalErrors = document.getElementById('final-errors');
  const finalCPS = document.getElementById('final-cps');
  const closeModalBtn = document.getElementById('close-modal-btn');

  // Typing test data
  const sampleTexts = [
    "The quick brown fox jumps over the lazy dog.",
    "Typing speed tests improve your keyboard skills.",
    "Practice makes perfect, so keep on typing!",
    "SpeedTester helps you measure your typing skills.",
    "Challenge yourself to type faster and more accurately.",
    "Modern web apps are responsive and user-friendly.",
    "Each keystroke counts in every typing competition.",
    "Fingers dance across the keyboard in perfect harmony.",
    "Accuracy and speed are both essential in typing tests.",
    "Stay focused and let your typing skills shine.",
    "This sentence is added to increase variety and length for more practice.",
    "Typing requires concentration, speed, and accuracy for best results.",
    "Consumers expect fast and reliable applications in modern interfaces."
  ];

  let testText = "";
  let timer = null;
  let timeLeft = 60;
  let testDuration = 60;
  let isTestRunning = false;
  let currentCharIndex = 0;
  let errors = 0;
  let typedChars = 0;
  let startTime = null;

  // Switch from landing page to typing test page
  function showSpeedTester() {
    landingPage.classList.add('hidden');
    speedTesterPage.classList.add('active');
    speedTesterPage.focus();
  }

  goToTesterBtn.addEventListener('click', () => {
    showSpeedTester();
  });

  // Dark mode toggle with persistence
  function loadTheme() {
    const theme = localStorage.getItem("speedtester-theme");
    if (theme === "light") {
      document.body.classList.add("light");
      darkIcon.textContent = "light_mode";
    } else {
      document.body.classList.remove("light");
      darkIcon.textContent = "dark_mode";
    }
  }
  function toggleTheme() {
    if (document.body.classList.contains("light")) {
      document.body.classList.remove("light");
      localStorage.setItem("speedtester-theme", "dark");
      darkIcon.textContent = "dark_mode";
    } else {
      document.body.classList.add("light");
      localStorage.setItem("speedtester-theme", "light");
      darkIcon.textContent = "light_mode";
    }
  }
  darkToggleBtn.addEventListener("click", toggleTheme);

  // Render test text with each char wrapped
  function renderTestText() {
    testTextElement.innerHTML = "";
    for (let i = 0; i < testText.length; i++) {
      const span = document.createElement("span");
      span.classList.add("char");
      span.textContent = testText[i];
      if (i === 0) span.classList.add("current");
      testTextElement.appendChild(span);
    }
    wordsCountEl.textContent = testText.trim().split(/\s+/).length;
  }

  // Update timer and progress bar
  function updateTimer() {
    timeLeftEl.textContent = timeLeft;
    const progressPercent = ((testDuration - timeLeft) / testDuration) * 100;
    progressBar.style.width = progressPercent + "%";
  }

  // Update WPM, accuracy, errors, CPS stats
  function updateStats() {
    const now = Date.now();
    const elapsedMs = now - startTime;
    const elapsedMinutes = elapsedMs / 1000 / 60;
    const grossWPM = typedChars / 5 / (elapsedMinutes || 1);
    const netWPM = Math.max(0, grossWPM - (errors / (elapsedMinutes || 1)));
    wpmEl.textContent = isNaN(netWPM) ? 0 : Math.floor(netWPM);
    const accuracy = typedChars > 0 ? Math.max(0, ((typedChars - errors) / typedChars) * 100) : 100;
    accuracyEl.textContent = accuracy.toFixed(0);
    errorsEl.textContent = errors;
    const cps = typedChars / (elapsedMs / 1000 || 1);
    cpsEl.textContent = cps.toFixed(2);
  }

  // Handle user key input
  function handleInput(e) {
    if (!isTestRunning) return;

    const charSpans = testTextElement.querySelectorAll(".char");
    const inputChar = e.key;

    if (inputChar.length === 1) {
      if (currentCharIndex >= testText.length) return;

      const expectedChar = testText[currentCharIndex];
      const charSpan = charSpans[currentCharIndex];

      if (inputChar === expectedChar) {
        charSpan.classList.add("correct");
      } else {
        charSpan.classList.add("incorrect");
        errors++;
      }

      charSpan.classList.remove("current");
      currentCharIndex++;

      if (currentCharIndex < testText.length) {
        charSpans[currentCharIndex].classList.add("current");
      }

      typedChars++;

      updateStats();

      if (currentCharIndex === testText.length) {
        endTest();
      }
    } else if (inputChar === "Backspace") {
      if (currentCharIndex === 0) return;
      if (currentCharIndex < testText.length) {
        charSpans[currentCharIndex].classList.remove("current");
      }
      currentCharIndex--;
      const charSpan = charSpans[currentCharIndex];
      if (charSpan.classList.contains("incorrect")) {
        errors--;
      }
      charSpan.classList.remove("correct", "incorrect");
      charSpan.classList.add("current");
      typedChars--;
      updateStats();
    }
  }

  // Countdown 3 seconds before test start
  function countdownBeforeStart() {
    let countdown = 3;
    testTextElement.textContent = countdown;
    return new Promise(resolve => {
      const interval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          testTextElement.textContent = countdown;
        } else {
          clearInterval(interval);
          resolve();
        }
      }, 1000);
    });
  }

  // Start the typing test after countdown
  async function startTest() {
    if (isTestRunning) return;
    startBtn.disabled = true;
    resetBtn.disabled = true;
    durationSelect.disabled = true;

    await countdownBeforeStart();

    testText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    currentCharIndex = 0;
    errors = 0;
    typedChars = 0;
    timeLeft = testDuration = parseInt(durationSelect.value, 10) || 60;
    isTestRunning = true;
    startTime = Date.now();
    resetBtn.disabled = false;
    renderTestText();
    updateTimer();
    updateStats();
    hiddenInput.value = "";
    hiddenInput.focus();
    timer = setInterval(() => {
      timeLeft--;
      updateTimer();
      if (timeLeft <= 0) {
        endTest();
      }
    }, 1000);
  }

  // End the test, show modal results
  function endTest() {
    if (!isTestRunning) return;
    isTestRunning = false;
    clearInterval(timer);
    timer = null;
    startBtn.disabled = false;
    resetBtn.disabled = false;
    durationSelect.disabled = false;
    hiddenInput.blur();
    const charSpans = testTextElement.querySelectorAll(".char");
    charSpans.forEach(span => span.classList.remove("current"));
    showFinalModal();
  }

  // Reset the test view to initial state
  function resetTest() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    isTestRunning = false;
    startBtn.disabled = false;
    resetBtn.disabled = true;
    durationSelect.disabled = false;
    testText = "";
    currentCharIndex = 0;
    errors = 0;
    typedChars = 0;
    timeLeft = testDuration = parseInt(durationSelect.value, 10) || 60;
    testTextElement.textContent = "Click start to begin the typing test.";
    timeLeftEl.textContent = timeLeft;
    wpmEl.textContent = 0;
    accuracyEl.textContent = 100;
    errorsEl.textContent = 0;
    cpsEl.textContent = 0;
    wordsCountEl.textContent = 0;
    progressBar.style.width = "0%";
    hiddenInput.value = "";
    hiddenInput.blur();
  }

  // Show final modal with score
  function showFinalModal() {
    finalWPM.textContent = wpmEl.textContent;
    finalAccuracy.textContent = accuracyEl.textContent + '%';
    finalErrors.textContent = errorsEl.textContent;
    finalCPS.textContent = cpsEl.textContent;
    finalModal.classList.add("active");
    finalModal.focus();
  }

  // Close final modal and reset test
  function closeFinalModal() {
    finalModal.classList.remove("active");
    resetTest();
    startBtn.focus();
  }

  // Event listeners setup
  testTextElement.addEventListener("click", () => {
    if (isTestRunning) hiddenInput.focus();
  });

  hiddenInput.addEventListener("keydown", handleInput);

  startBtn.addEventListener("click", startTest);
  resetBtn.addEventListener("click", resetTest);

  closeModalBtn.addEventListener("click", closeFinalModal);

  finalModal.addEventListener("keydown", (e) => {
    if (e.key === "Escape" || e.key === "Enter") {
      e.preventDefault();
      closeFinalModal();
    }
  });

  // Keyboard shortcuts for start and reset when not typing
  window.addEventListener("keydown", (e) => {
    // Ignore if typing on the input
    if (document.activeElement === hiddenInput) return;
    if (e.key === "Enter" && !isTestRunning) {
      e.preventDefault();
      startTest();
    }
    if (e.key === "Escape" && isTestRunning) {
      e.preventDefault();
      resetTest();
    }
  });

  // Load theme preference on page load
  loadTheme();
  // Initialize with landing page only
  resetTest();
})();