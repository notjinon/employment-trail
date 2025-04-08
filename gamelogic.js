let currentSlide = 0;
let currentQuestionIndex = 0;
let questions = [];
let responses = {};
let gameState = {
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

async function loadGameData() {
  const qRes = await fetch("questions.json");
  const rRes = await fetch("responses.json");
  const qData = await qRes.json();
  const rData = await rRes.json();

  questions = qData.questions;
  responses = {};

  // Index responses by key for quick lookup
  rData.responses.forEach(res => {
    responses[res.id] = res.response;
  });

}
function startGame() {
  // Advance from slide 1 to question slide
  nextSlide(); // This should hide slide-1 and show slide-2 ("question-slide")
  showQuestion();
}

function showQuestion() {
  const question = questions[currentQuestionIndex];
  const qText = document.getElementById("question-text");
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

  // Create a "Submit" button to confirm selection.
  const submitBtn = document.createElement("button");
  submitBtn.type = "button"; // Prevents form submission refresh.
  submitBtn.innerText = "Submit";
  submitBtn.className = "button";
  submitBtn.onclick = submitOption;
  optionsContainer.appendChild(submitBtn);

  // Switch to the question slide.
  switchSlide("question-slide");
}

function submitOption() {
  // Find the checked radio option.
  const selected = document.querySelector('input[name="question"]:checked');
  if (!selected) {
    alert("Please select an option before continuing.");
    return;
  }

  // Find the corresponding option in our current question.
  const question = questions[currentQuestionIndex];
  const selectedOpt = question.options.find(opt => opt.key == selected.value);

  // Apply the stat effects.
  for (let stat in selectedOpt.effects) {
    if (gameState.hasOwnProperty(stat)) {
      gameState[stat] += selectedOpt.effects[stat];
    }
  }

  // Retrieve and display the feedback.
  const feedbackText = responses[selectedOpt.key] || "No response available.";
  document.getElementById("feedback-text").innerText = feedbackText;
  
  // Move to the feedback slide.
  switchSlide("feedback-slide");
}

function nextQuestion() {
  currentQuestionIndex++;
  showQuestion();
  switchSlide("question-slide");
}

function switchSlide(id) {
  slides.forEach(slide => slide.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

window.onload = loadGameData;