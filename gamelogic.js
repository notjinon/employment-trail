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
  }
  const optionsContainer = document.getElementById("options-container");
  
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
  // UNCOMMENT ON PROD
  document.getElementById("question-text").textContent = question.question;
  // document.getElementById("question-text").textContent = question.question + "\n\n DEBUG: " + currentQuestionKey;
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

  if (currentQuestionKey == 114100){
    if (selectedOpt.key == 114900) {
      if(gameState.technology >= 4 && gameState.school == 3) // tech >= 4 and school == washington
      {
        gameState.company = 1; // Set company to 1
        currentResponseId = 114901; // Set response ID to 114901
      } else if (gameState.defense >= 4 && gameState.school == 4) // defense >= 4 and school == georgiatech
      {
        gameState.company = 4; // Set company to 4
        currentResponseId = 114904; // Set response ID to 114904
      } else if (gameState.finance >= 4 && gameState.school == 2) // finance >= 4 and school == cornell
      {
        gameState.company = 2; // Set company to 2
        currentResponseId = 114902; // Set response ID to 114902
      } else if (gameState.manufacturing >= 4 && gameState.school == 1) // manufacturing >= 4 and school == purdue
      {
        gameState.company = 3; // Set company to 3
        currentResponseId = 114903; // Set response ID to 114903
      } else {
        gameState.company = 9; // Set company to 9
        currentResponseId = 114905; // Set response ID to 114905
      }
    } // Unicorn
    else if (selectedOpt.key == 114200) {// CapitalOne
      if(gameState.finance >= 2) 
      {
        gameState.company = 5; // Set company to 5
        currentResponseId = 114201; // Set response ID to 114201
      }else{
        gameState.company = 9; // Set company to 9
        currentResponseId = 114202; // Set response ID to 114202
      }
    } 
    else if (selectedOpt.key == 114400) {// IBM
      if(gameState.technology >= 2)
      {
        gameState.company = 6; // Set company to 6
        currentResponseId = 114401; // Set response ID to 114401
      } else {
        gameState.company = 9; // Set company to 9 
        currentResponseId = 114402; // Set response ID to 114402
      } 
    } 
    else if (selectedOpt.key == 114300) { // L3Harris
      if(gameState.defense >= 2)
      {
        gameState.company = 7; // Set company to 7
        currentResponseId = 114301; // Set response ID to 114301
      } else {
        gameState.company = 9; // Set company to 9
        currentResponseId = 114302; // Set response ID to 114302
      }
    } 
    else if (selectedOpt.key == 114500) { // GM
      if (gameState.manufacturing >= 2)
      {
        gameState.company = 8; // Set company to 8
        currentResponseId = 114501; // Set response ID to 114501
      } else {
        gameState.company = 9; // Set company to 9
        currentResponseId = 114502; // Set response ID to 114502
      }
    } 
    else if (selectedOpt.key == 114600) {
      gameState.company = 9; // Set company to 9
      gameState.social += 1; // Increase social by 1
      currentResponseId = 114601; // Set response ID to 114601
    } // Deloitte

  } else if (currentQuestionKey == 120100) {
    // Evaluate ending conditions for question 120100, including fondness variants.
    if (gameState.social >= 10 && gameState.academic >= 10 &&
        (gameState.company === 1 || gameState.company === 2 || gameState.company === 3 || gameState.company === 4)) {
        
        // For companies 1-4: check for fondness variants
        if (gameState.company === 1) {
            if (gameState.fondness >= 10) {
                gameState.ending = 87;  // Variant ending for company 1 when fondness is high
            } else {
                gameState.ending = 7;          // Base ending for company 1
            }
        } else if (gameState.company === 2) {
            if (gameState.fondness >= 10) {
                gameState.ending = 88;  // Variant ending for company 2 when fondness is high
            } else {
                gameState.ending = 8;          // Base ending for company 2
            }
        } else if (gameState.company === 3) {
            if (gameState.fondness >= 10) {
                gameState.ending = 89;  // Variant ending for company 3 when fondness is high
            } else {
                gameState.ending = 9;          // Base ending for company 3
            }
        } else if (gameState.company === 4) {
            if (gameState.fondness >= 10) {
                gameState.ending = 90;  // Variant ending for company 4 when fondness is high
            } else {
                gameState.ending = 10;          // Base ending for company 4
            }
        }
        currentResponseId = 120101; // Use generic "pass" feedback
    } else if (gameState.social >= 7 && gameState.academic >= 7 &&
               (gameState.company === 5 || gameState.company === 6 || gameState.company === 7 || gameState.company === 8 || gameState.company === 9)) {
        
        // For companies 5-9: check for fondness variants
        if (gameState.company === 5) {
            if (gameState.fondness >= 10) {
                gameState.ending = 92;  // Variant ending for company 5 when fondness is high
            } else {
                gameState.ending = 12;          // Base ending for company 5
            }
        } else if (gameState.company === 6) {
            if (gameState.fondness >= 10) {
                gameState.ending = 93;  // Variant ending for company 6 when fondness is high
            } else {
                gameState.ending = 13;          // Base ending for company 6
            }
        } else if (gameState.company === 7) {
            if (gameState.fondness >= 10) {
                gameState.ending = 94;  // Variant ending for company 7 when fondness is high
            } else {
                gameState.ending = 14;          // Base ending for company 7
            }
        } else if (gameState.company === 8) {
            if (gameState.fondness >= 10) {
                gameState.ending = 91;  // Variant ending for company 8 when fondness is high
            } else {
                gameState.ending = 11;          // Base ending for company 8
            }
        } else if (gameState.company === 9) {
            if (gameState.fondness >= 10) {
                gameState.ending = 95;  // Variant ending for company 9 when fondness is high
            } else {
                gameState.ending = 15;          // Base ending for company 9
            }
        }
        currentResponseId = 120101; // Use generic "pass" feedback
    } 
    else {
        gameState.ending = 0;      // No ending condition is met
        currentResponseId = 120102; // Use alternate response
    }
  } else if ([121100, 121200, 121300, 121400].includes(currentQuestionKey)) {
    if (selectedOpt.key == 121101 || selectedOpt.key == 121201) {
      currentResponseId = 121101
      gameState.fondness >= 10 ? gameState.ending = 96 : gameState.ending = 16;
    } else if (selectedOpt.key == 121102 || selectedOpt.key == 121301) {
      currentResponseId = 121102
      gameState.fondness >= 10 ? gameState.ending = 97 : gameState.ending = 17;
    } else {
      currentResponseId = 121103
      gameState.fondness >= 10 ? gameState.ending = 98 : gameState.ending = 18;
    }
  } else {
  // Retrieve the full response object using the option key.
  // Get and store response ID for use in nextQuestion()
  currentResponseId = selectedOpt.key;
  }
  const response = responses[currentResponseId];
  if (!response) {
  alert("No response available for the selected option.");
  return;
  }

  // Apply the status effects from the response object.
  if (response.effects) {
    for (let stat in response.effects) {
      if (gameState.hasOwnProperty(stat)) {
        gameState[stat] += response.effects[stat];
      }
    }
  }
  // Set the feedback text from the response.
  document.getElementById("feedback-text").innerText = response.response;

  // Build a debug string from the current gameState object.
  // const gameStateDebug = Object.keys(gameState)
  //   .map(stat => `${stat}: ${gameState[stat]}`)
  //   .join(", ");

  // // Append the debug information to the feedback text.
  // document.getElementById("feedback-text").innerText += "\n\nDEBUG: " + gameStateDebug;

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
  const response = responses[currentResponseId];
  let nextKey;

  if (response.nextQuestion) {
    // Use explicit next question from response
    nextKey = response.nextQuestion;
  } else {
    // Default to next sequential key
    nextKey = currentQuestionKey += 1000;
  }

  // Check if you're on a branching question
  let branchingQuestionKey = [108000, 110000, 113000, 114000, 115000, 116000, 117000, 120000, 121000];
  if (branchingQuestionKey.includes(nextKey)) {
    switch (nextKey) {
      case 108000:
        // Check if Burnout < 4, if so, go to 108100 else 108200
        nextKey = gameState.burnout < 4 ? 108100 : 108200;
        break;
      case 110000:
        //Check if Academic Skill > 3, if so, go to 110100 else 110200
        nextKey = gameState.academic > 3 ? 110100 : 110200;
        break;
      case 113000:
        //Check if Social Skill >= 5, if so go to 113100 else 113200
        nextKey = gameState.social >= 5 ? 113100 : 113200;
        break;
      case 114000:
        nextKey = 114100;
        break;
      case 115000:
        nextKey = gameState.burnout < 4 ? 115100 : 115200;
        break;
      case 116000:
        nextKey = gameState.fondness >= 4 ? 116100 : 116200;
        break;
      case 117000:
        if (gameState.fondness >= 10 && gameState.burnout < 4) {
          nextKey = 117100;
          break;
        } else if (gameState.fondness >= 10)
        {
          nextKey = 117200;
          break;
        } else if (gameState.burnout < 4)
        {
          nextKey = 117300;
          break;
        } else 
        {
          nextKey = 117400;
          break;
        }
      case 120000:{
        nextKey = 120100;
        break;
      }
      case 121000:
        if (gameState.burnout < 4 && gameState.social >= 5 && gameState.academic >= 5) {
          nextKey = 121100;
          break;
        } else if (gameState.burnout < 4 && gameState.social >= 5) {
          nextKey = 121200;
          break;
        } else if (gameState.burnout < 4 && gameState.academic >= 5) {
          nextKey = 121300;
          break;
        } else {
          nextKey = 121400;
          break;
        }
      }
    }

  // Get the question object
  const nextQuestion = questions[nextKey];
  if (!nextQuestion) {
      console.error(`Question with key ${nextKey} not found`);
      return;
  }

  // Update current question key and display
  currentQuestionKey = nextKey;
  showQuestion();
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
        //Populate the subtitle text on the first ending slide with subtitle
        document.getElementById("ending-subtitle").innerText = ending.subtitle;
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