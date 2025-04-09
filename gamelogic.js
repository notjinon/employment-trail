let currentSlide = 0;
let currentEnding = null;
let nextQuestionKey = null;
let currentQuestionKey = 101000;
let currentResponseId = null;
let questions = [];
let responses = {};
let gameState = {
  school: 0,
  academic: 0,
  burnout: 0,
  social: 0,
  fondness: 0,
  technology: 0,
  finance: 0,
  defense: 0,
  manufacturing: 0,
  company: 0,
  ending: 0,
};

const slides = document.querySelectorAll(".slide");

function nextSlide() {
  slides[currentSlide].classList.add("hidden");
  currentSlide++;
  slides[currentSlide].classList.remove("hidden");
}

function switchSlide(id) {
  slides.forEach(slide => slide.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function startGame() {
  // Advance from slide 1 to question slide
  nextSlide(); // This should hide slide-1 and show slide-2 ("question-slide")
  showQuestion();
}

async function loadGameData() {
  const qRes = await fetch("questions.json");
  const rRes = await fetch("responses.json");
  const qData = await qRes.json();
  const rData = await rRes.json();

  questions = Object.fromEntries(
    qData.questions.map(q => [q.key, q])
);
responses = Object.fromEntries(
    rData.responses.map(r => [r.id, r])
);

}

function showQuestion() {
  const question = questions[currentQuestionKey];
  if (!question) {
      console.error(`Question ${currentQuestionKey} not found`);
      return;
  }  const qText = document.getElementById("question-text");
  const optionsContainer = document.getElementById("options-container");

  // Set the question text.
  qText.innerText = question.question;
  
  // Clear any previous options.
  optionsContainer.innerHTML = "";

  // Create a form to hold radio options.
  const form = document.createElement("form");
  form.id = "options-form";

  // Create a radio input and label for each option.
  question.options.forEach((opt, index) => {
    // Create the container for each option.
    const optionDiv = document.createElement("div");
    optionDiv.className = "option"; // Use this class in CSS for vertical spacing.

    // Create radio input.
    const input = document.createElement("input");
    input.type = "radio";
    input.id = `option-${index}`;
    input.name = "question"; // Same 'name' so only one can be selected.
    input.value = opt.key;    // Use the option key from your JSON.

    // Create a label for the radio input.
    const label = document.createElement("label");
    label.htmlFor = `option-${index}`;
    label.innerText = opt.option;

    // Append the radio input and label to the option container.
    optionDiv.appendChild(input);
    optionDiv.appendChild(label);

    // Append the option container to the form.
    form.appendChild(optionDiv);
  });

  // Append the form to the options container.
  optionsContainer.appendChild(form);

  // Switch to the question slide.
  document.getElementById("question-text").textContent = question.question;
  renderOptions(question.options);
  switchSlide("question-slide");
}


function submitOption() {
  // Find the checked radio option.
  const selected = document.querySelector('input[name="question"]:checked');
  if (!selected) {
    alert("Please select an option before continuing.");
    return;
  }

  // Get current question and selected option
  const question = questions[currentQuestionKey];
  const selectedOpt = question.options.find(opt => opt.key == selected.value);

  // Retrieve the full response object using the option key.
    // Get and store response ID for use in nextQuestion()
  currentResponseId = selectedOpt.key;
  const response = responses[currentResponseId];
  if (!responseObj) {
  alert("No response available for the selected option.");
  return;
  }

  // Apply the status effects from the response object.
  if (responseObj.effects) {
    for (let stat in response.effects) {
      if (gameState.hasOwnProperty(stat)) {
        gameState[stat] += responseObj.effects[stat];
      }
    }
  }

  // Set the feedback text from the response.
  document.getElementById("feedback-text").innerText = response.response;

  // Build a debug string from the current gameState object.
  const gameStateDebug = Object.keys(gameState)
    .map(stat => `${stat}: ${gameState[stat]}`)
    .join(", ");

  // Append the debug information to the feedback text.
  document.getElementById("feedback-text").innerText += "\n\nDEBUG: " + gameStateDebug;

  // Move to the feedback slide.
  switchSlide("feedback-slide");
}

function nextQuestion() {
  // FIRST PRIORITY: Check for ending condition
  if (gameState.ending !== 0) {
      endGame(gameState.ending);
      return;
  }

  // Get the next question key from the current response
  const currentResponse = responses[currentResponseId];
  let nextKey;

  if (currentResponse.nextQuestion) {
      // Use explicit next question from response
      nextKey = currentResponse.nextQuestion;
  } else {
      // Default to next sequential key
      nextKey = getNextSequentialKey(currentQuestionKey);
  }

  // Get the question object
  const nextQuestion = questions[nextKey];
  if (!nextQuestion) {
      console.error(`Question with key ${nextKey} not found`);
      return;
  }

  // Check if this question has state-based variations
  if (nextQuestion.stateCheck) {
      // Evaluate condition and get appropriate version
      const condition = evaluateCondition(nextQuestion.stateCheck.condition, gameState);
      nextKey = condition ? 
          nextKey.slice(0,4) + "100" :  // True path
          nextKey.slice(0,4) + "200";   // False path
  }

  // Update current question key and display
  currentQuestionKey = nextKey;
  showQuestion();
}

function evaluateCondition(condition, gameState) {
  // Handle condition evaluation
  // Could be simple comparison or more complex logic
  const [stat1, operator, stat2] = condition.split(' ');
  switch(operator) {
      case '>':
          return gameState[stat1] > gameState[stat2];
      case '<':
          return gameState[stat1] < gameState[stat2];
      // Add other operators as needed
  }
}

function evaluateStateCheck(stateCheck) {
  // Evaluate conditions and return appropriate question key
  if (evaluateCondition(stateCheck.condition, gameState)) {
      return stateCheck.truePath;
  }
  return stateCheck.falsePath;
}

function endGame(endingCode) {
  fetch("endings.json")
    .then(response => response.json())
    .then(data => {
      const ending = data.endings.find(e => e.code === endingCode);
      if (ending) {
        // Store the current ending globally for use by the next ending slide.
        currentEnding = ending;
        document.getElementById("ending-title").innerText = ending.title;
        // Populate the ending text on the first ending slide with S1.
        document.getElementById("ending-text").innerText = ending.s1;
        switchSlide("ending-slide-1");
      } else {
        console.warn("Ending not found in endings.json");
        alert("Game Over.");
      }
    })
    .catch(error => {
      console.error("Error fetching endings.json:", error);
      alert("Game Over.");
    });
}


function nextEndingSlide() {
  if (currentEnding) {
    document.getElementById("final-text").innerText = currentEnding.s2;
    switchSlide("ending-slide-2");
  }
}


function restartGame() {
  window.location.href = "index.html";
}


window.onload = loadGameData;