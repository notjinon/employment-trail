// ===== Configuration Maps =====
const SCHOOL_MAP = {
  0: "High School Student",
  1: "Purdue Boilermaker",
  2: "Cornellian",
  3: "Washington Husky",
  4: "Duke Blue Devil"
};

const COMPANY_MAP = {
  // Boutique tier
  1: "JPMorgan Chase",
  2: "Apple",
  3: "Anduril Industries",
  4: "TSMC",
  // Mid-major tier
  5: "Bank of America",
  6: "IBM",
  7: "RTX Corporation",
  8: "Siemens",
  // Weak tier
  9: "Pinnacle Credit Union",
  10: "TechFlow Solutions",
  11: "Mason Defense Services",
  12: "Apex Components",
  // Failstate
  100: "Municipal Internship",
  101: "Paid Research",
  102: "Nothing"
};

// Tier configurations - { max, label }
const BURNOUT_TIERS = [
  { max: 1, label: "No Pressure" },
  { max: 3, label: "Normal Stress" },
  { max: 5, label: "Daily Migraines" },
  { max: 7, label: "Hourly Caffeine" },
  { max: Infinity, label: "On Watchlist" }
];

const ACADEMICS_TIERS = [
  { max: 1, label: "Dunce" },
  { max: 3, label: "ChatGPT User" },
  { max: 5, label: "Nothing Special" },
  { max: 7, label: "B Average" },
  { max: Infinity, label: "Fucking Nerd" }
];

const SOCIAL_TIERS = [
  { max: 1, label: "Sherm" },
  { max: 3, label: "Irrelevant Loser" },
  { max: 5, label: "Side Character" },
  { max: 7, label: "Social Butterfly" },
  { max: Infinity, label: "Prestige Whore" }
];

const FONDNESS_TIERS = [
  { max: 2, label: "\"You're a Chud.\""},
  { max: 4, label: "\"Who are you again?\"" },
  { max: 6, label: "\"Aren't you in my class?\"" },
  { max: 8, label: "\"You're not that ugly.\"" },
  { max: Infinity, label: "\"We're getting married!\"" }
];

// Branch rules - key: function that returns next question key
const BRANCH_RULES = {
  108000: (g) => g.burnout < 4 ? 108100 : 108200,
  110000: (g) => g.academic > 3 ? 110100 : 110200,
  113000: (g) => {
    // Leaning checkpoint - if too far in either direction, a friend leaves
    if (g.leaning >= 4) return 113300; // Tara leaves (too Chen-aligned)
    if (g.leaning <= -4) return 113400; // Chen leaves (too Tara-aligned)
    // Normal dinner variants based on social
    return g.social >= 5 ? 113100 : 113200;
  },
  114000: () => 114100,
  115000: (g) => g.burnout < 4 ? 115100 : 115200,
  116000: (g) => g.fondness >= 4 ? 116100 : 116200,
  117000: (g) => {
    // Failstate skips interview prep - go to failstate Q17
    if (g.failstate) {
      if (g.fondness >= 10) return 117500; // Failstate with girlfriend
      return 117600; // Failstate alone
    }
    if (g.fondness >= 10 && g.burnout < 2) return 117100;
    if (g.fondness >= 10) return 117200;
    if (g.burnout < 2) return 117300;
    return 117400;
  },
  118000: (g) => {
    // Failstate skips interview - go to failstate Q18
    if (g.failstate) {
      if (g.fondness >= 10) return 118500; // Failstate with girlfriend
      return 118600; // Failstate alone
    }
    return 118000; // Normal interview question
  },
  119000: (g) => {
    // Failstate skips post-interview reflection
    if (g.failstate) return 121000; // Skip to backup plans
    return 119000; // Normal post-interview
  },
  120000: (g) => {
    // Failstate skips offer email
    if (g.failstate) return 121000; // Skip to backup plans
    return 120100;
  },
  121000: (g) => {
    // Failstate gets different Q21 variants
    if (g.failstate) {
      if (g.fondness >= 10 && g.academic >= 5) return 121500; // gf + research option
      if (g.fondness >= 10) return 121600; // gf only
      if (g.academic >= 5) return 121700; // research option only
      return 121800; // nothing
    }
    if (g.burnout < 4 && g.social >= 5 && g.academic >= 5) return 121100;
    if (g.burnout < 4 && g.social >= 5) return 121200;
    if (g.burnout < 4 && g.academic >= 5) return 121300;
    return 121400;
  }
};

// Company selection - tier-based system
// Tier keys map to response option keys: 114100 = boutique, 114200 = midMajor, 114300 = weak
const TIER_MAP = {
  114100: "boutique",
  114200: "midMajor",
  114300: "weak"
};

// Sector detection: returns the sector with highest stat
function getMaxSector(g) {
  const sectors = {
    finance: g.finance || 0,
    technology: g.technology || 0,
    defense: g.defense || 0,
    manufacturing: g.manufacturing || 0
  };
  return Object.entries(sectors).reduce((a, b) => b[1] > a[1] ? b : a)[0];
}

// Company selection: checks thresholds and returns company info
// Called with gameState, tier key, and loaded companies data
function selectCompany(g, tierKey, companiesData) {
  const tier = TIER_MAP[tierKey];
  if (!tier) return null;
  
  const sector = getMaxSector(g);
  const thresholds = companiesData.thresholds[tier];
  const academic = g.academic || 0;
  const social = g.social || 0;
  
  // Check if player meets thresholds (academic for skill, social for social)
  if (academic >= thresholds.skill && social >= thresholds.social) {
    const company = companiesData.companies[tier][sector];
    return {
      success: true,
      company: company,
      sector: sector,
      tier: tier
    };
  }
  
  // Failed threshold check
  return {
    success: false,
    sector: sector,
    tier: tier
  };
}

// Ending rules for question 120100
// New company IDs: 1-4 boutique (JPMC, Apple, Anduril, TSMC)
//                  5-8 midMajor (BofA, IBM, RTX, Siemens)
//                  9-12 weak (Pinnacle, TechFlow, Mason, Apex)
const ENDING_MAP = {
  // Boutique tier endings
  1: 7, 2: 8, 3: 9, 4: 10,
  // Mid-major tier endings
  5: 12, 6: 13, 7: 14, 8: 11,
  // Weak tier endings
  9: 92, 10: 93, 11: 94, 12: 95,
  // Fondness variants
  fondness: { 
    1: 87, 2: 88, 3: 89, 4: 90,
    5: 92, 6: 93, 7: 94, 8: 91,
    9: 96, 10: 96, 11: 96, 12: 96
  }
};

// Character maps - loaded from characters.json
let GIRLFRIEND_MAP = {};
let BESTFRIEND_MAP = {};
let ROOMMATE_MAP = {};

// ===== Helper Functions =====
function getTier(value, tiers) {
  return tiers.find(t => value <= t.max)?.label || tiers[tiers.length - 1].label;
}

function clampPercent(value, max) {
  return Math.max(0, Math.min(value / max, 1)) * 100 + "%";
}

function getTimePeriod(questionKey) {
  if (questionKey < 104000) return "High School";
  if (questionKey < 105000) return "Early August";
  if (questionKey < 106000) return "Late August";
  if (questionKey < 108000) return "Mid September";
  if (questionKey < 111000) return "Mid October";
  if (questionKey < 114000) return "Early November";
  if (questionKey < 117000) return "Late November";
  if (questionKey < 120000) return "Early December";
  return "Late December";
}

// ===== DOM Cache =====
const DOM = {};

function cacheDOM() {
  DOM.questionText = document.getElementById("question-text");
  DOM.optionsContainer = document.getElementById("options-container");
  DOM.feedbackText = document.getElementById("feedback-text");
  DOM.statusSchool = document.getElementById("status-school");
  DOM.statusTerm = document.getElementById("status-term");
  DOM.statusCompany = document.getElementById("status-company");
  DOM.statusBurnout = document.getElementById("status-burnout");
  DOM.statusAcademics = document.getElementById("status-academics");
  DOM.statusSocial = document.getElementById("status-social");
  DOM.barSocial = document.getElementById("bar-social");
  DOM.barAcademics = document.getElementById("bar-academics");
  DOM.barBurnout = document.getElementById("bar-burnout");
  DOM.barFondness = document.getElementById("bar-fondness");
  DOM.barLeaningLeft = document.getElementById("bar-leaning-left");
  DOM.barLeaningRight = document.getElementById("bar-leaning-right");
  DOM.fondnessText = document.getElementById("fondness-text");
  DOM.leaningText = document.getElementById("leaning-text");
  DOM.endingTitle = document.getElementById("ending-title");
  DOM.endingSubtitle = document.getElementById("ending-subtitle");
  DOM.endingText = document.getElementById("ending-text");
  DOM.finalText = document.getElementById("final-text");
}

// ===== Game State =====
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
  girlfriendId: 0,
  bestFriendId: 1,
  roommateId: 1,
  leaning: 0
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

// Companies data - loaded from companies.json
let companiesData = {};

async function loadGameData() {
  const [qRes, rRes, cRes, compRes] = await Promise.all([
    fetch("questions.json"),
    fetch("responses.json"),
    fetch("characters.json"),
    fetch("companies.json")
  ]);
  const [qData, rData, cData, compData] = await Promise.all([
    qRes.json(), rRes.json(), cRes.json(), compRes.json()
  ]);

  questions = Object.fromEntries(qData.questions.map(q => [q.key, q]));
  responses = Object.fromEntries(rData.responses.map(r => [r.id, r]));

  // Load character maps
  GIRLFRIEND_MAP = cData.girlfriends;
  BESTFRIEND_MAP = cData.bestFriends;
  ROOMMATE_MAP = cData.roommates;
  
  // Load companies data
  companiesData = compData;
  
  // Cache DOM elements after page load
  cacheDOM();
  
  // Set up keyboard shortcuts for option selection
  document.addEventListener("keydown", handleNumberKeyPress);
  
  // Set up debug menu trigger
  let debugBuffer = "";
  document.addEventListener("keydown", (event) => {
    debugBuffer += event.key.toLowerCase();
    if (debugBuffer.length > 9) {
      debugBuffer = debugBuffer.slice(-9);
    }
    if (debugBuffer.endsWith("debugdebug")) {
      showDebugMenu();
      debugBuffer = "";
    }
  });
}

function showDebugMenu() {
  const debugInfo = {
    gameState: gameState,
    currentQuestion: questions[currentQuestionKey],
    currentResponseId: currentResponseId
  };
  
  console.log("=== GAME STATE DEBUG ===");
  console.table(gameState);
  console.log("Current Question:", currentQuestionKey, questions[currentQuestionKey]);
  console.log("Current Response ID:", currentResponseId);
  console.log("Full Debug Object:", debugInfo);
  
  alert("DEBUG MENU OPENED - Check browser console for gameState details!\n\n" + 
    JSON.stringify(gameState, null, 2));
}

function handleNumberKeyPress(event) {
  // Check if we're on the question slide
  if (document.getElementById("question-slide").classList.contains("hidden")) {
    return;
  }
  
  // Handle Enter key as submit
  if (event.key === "Enter") {
    submitOption();
    event.preventDefault();
    return;
  }
  
  // Check if key is 1-9
  const key = event.key;
  if (!/^[1-9]$/.test(key)) {
    return;
  }
  
  const optionIndex = parseInt(key) - 1;
  const radioButtons = document.querySelectorAll('input[name="question"]');
  
  if (optionIndex < radioButtons.length) {
    radioButtons[optionIndex].checked = true;
    radioButtons[optionIndex].focus();
    event.preventDefault();
  }
}

function showQuestion() {
  const question = questions[currentQuestionKey];
  if (!question) {
    console.error(`Question ${currentQuestionKey} not found`);
    return;
  }
  
  // Clear and rebuild options
  DOM.optionsContainer.innerHTML = "";
  const form = document.createElement("form");
  form.id = "options-form";

  question.options.forEach((opt, index) => {
    const optionDiv = document.createElement("div");
    optionDiv.className = "option";

    const input = document.createElement("input");
    input.type = "radio";
    input.id = `option-${index}`;
    input.name = "question";
    input.value = opt.key;

    const label = document.createElement("label");
    label.htmlFor = `option-${index}`;
    label.innerText = opt.option;

    optionDiv.appendChild(input);
    optionDiv.appendChild(label);
    form.appendChild(optionDiv);
  });

  DOM.optionsContainer.appendChild(form);
  DOM.questionText.textContent = question.question;
  switchSlide("question-slide");
}


function submitOption() {
  const selected = document.querySelector('input[name="question"]:checked');
  if (!selected) {
    alert("Please select an option before continuing.");
    return;
  }

  const question = questions[currentQuestionKey];
  const selectedOpt = question.options.find(opt => opt.key == selected.value);

  // Handle special question logic
  if (currentQuestionKey == 114100) {
    handleCompanySelection(selectedOpt.key);
  } else if (currentQuestionKey == 120100) {
    handleFinalEvaluation();
  } else if ([121100, 121200, 121300, 121400].includes(currentQuestionKey)) {
    handleFallbackEndings(selectedOpt.key);
  } else {
    currentResponseId = selectedOpt.key;
  }

  const response = responses[currentResponseId];
  if (!response) {
    alert("No response available for the selected option.");
    return;
  }

  // Apply effects
  if (response.effects) {
    for (let stat in response.effects) {
      if (gameState.hasOwnProperty(stat)) {
        gameState[stat] += response.effects[stat];
      }
    }
  }

  // Handle setEnding flag (for failstate responses)
  if (response.setEnding) {
    gameState.ending = response.setEnding;
  }

  DOM.feedbackText.innerText = response.response;
  switchSlide("feedback-slide");
}

function handleCompanySelection(optKey) {
  const tier = TIER_MAP[optKey];
  if (!tier) return;

  const sector = getMaxSector(gameState);
  const thresholds = companiesData.thresholds[tier];
  const academic = gameState.academic || 0;
  const social = gameState.social || 0;

  // Check if player meets thresholds (academic for skill, social for social)
  if (academic >= thresholds.skill && social >= thresholds.social) {
    // Success - got the interview
    const company = companiesData.companies[tier][sector];
    gameState.company = company.id;
    
    // Response ID format: 114[tier][sector]1
    // tier: 1=boutique, 2=midMajor, 3=weak
    // sector: 1=finance, 2=technology, 3=defense, 4=manufacturing
    const tierNum = tier === "boutique" ? 1 : tier === "midMajor" ? 2 : 3;
    const sectorNum = sector === "finance" ? 1 : sector === "technology" ? 2 : sector === "defense" ? 3 : 4;
    currentResponseId = parseInt(`114${tierNum}${sectorNum}1`);
  } else {
    // Failed - set failstate
    gameState.failstate = true;
    // Response ID is the tier fail response: 114100, 114200, or 114300
    currentResponseId = optKey;
  }
}

function handleFinalEvaluation() {
  const { social, academic, company, fondness } = gameState;
  
  // Company tiers: 1-4 boutique, 5-8 midMajor, 9-12 weak
  const isBoutique = company >= 1 && company <= 4;
  const isMidMajor = company >= 5 && company <= 8;
  const isWeak = company >= 9 && company <= 12;
  
  // Different thresholds by tier
  const passBoutique = social >= 10 && academic >= 10 && isBoutique;
  const passMidMajor = social >= 7 && academic >= 7 && isMidMajor;
  const passWeak = social >= 4 && academic >= 4 && isWeak;

  if (passBoutique || passMidMajor || passWeak) {
    const base = ENDING_MAP[company];
    gameState.ending = fondness >= 10 ? ENDING_MAP.fondness[company] : base;
    currentResponseId = 120101;
  } else {
    currentResponseId = 120102;
  }
}

function handleFallbackEndings(optKey) {
  const endingPairs = {
    121101: { base: 16, fondness: 96 },
    121201: { base: 16, fondness: 96 },
    121102: { base: 17, fondness: 97 },
    121301: { base: 17, fondness: 97 }
  };

  if (endingPairs[optKey]) {
    const pair = endingPairs[optKey];
    currentResponseId = [121101, 121201].includes(optKey) ? 121101 : 121102;
    gameState.ending = gameState.fondness >= 10 ? pair.fondness : pair.base;
  } else {
    currentResponseId = 121103;
    gameState.ending = gameState.fondness >= 10 ? 98 : 18;
  }
}

function nextQuestion() {
  // Check for ending condition first
  if (gameState.ending !== 0) {
    endGame(gameState.ending);
    return;
  }

  const response = responses[currentResponseId];
  let nextKey = response.nextQuestion || (currentQuestionKey + 1000);

  // Handle "ending" as a special nextQuestion value
  if (nextKey === "ending") {
    console.error("Reached 'ending' nextQuestion without setEnding - defaulting to demo ending");
    endGame(1);
    return;
  }

  // Apply branching rules if applicable
  if (BRANCH_RULES[nextKey]) {
    nextKey = BRANCH_RULES[nextKey](gameState);
  }

  const nextQuestion = questions[nextKey];
  if (!nextQuestion) {
    console.error(`Question with key ${nextKey} not found`);
    return;
  }

  currentQuestionKey = nextKey;
  showQuestion();
}

function showStatusScreen() {
  populateStatus();
  switchSlide("status-screen");
}

function showSocialScreen() {
  populateSocial();
  switchSlide("social-screen");
}

function backToQuestion() {
  switchSlide("question-slide");
}

function populateStatus() {
  // School name & color
  const schoolCode = gameState.school;
  const schoolName = SCHOOL_MAP[schoolCode] || "High School Student";
  const schoolNames = ["default", "purdue", "cornell", "washington", "duke"];
  
  DOM.statusSchool.textContent = schoolName;
  DOM.statusSchool.className = "status-value school-" + schoolNames[schoolCode];
  
  // Time period
  DOM.statusTerm.textContent = getTimePeriod(currentQuestionKey);
  
  // Company focus logic
  let companyFocus;
  if (gameState.company === 0) {
    if (currentQuestionKey < 106000) companyFocus = "Khan Academy";
    else if (currentQuestionKey < 114000) companyFocus = "LeetCode";
    else companyFocus = "Recruiting";
  } else {
    companyFocus = COMPANY_MAP[gameState.company] || "Unknown";
  }
  DOM.statusCompany.textContent = companyFocus;

  // Tier labels using generic getTier function
  DOM.statusBurnout.textContent = getTier(gameState.burnout, BURNOUT_TIERS);
  DOM.statusAcademics.textContent = getTier(gameState.academic, ACADEMICS_TIERS);
  DOM.statusSocial.textContent = getTier(gameState.social, SOCIAL_TIERS);

  // Update bar widths
  const maxStat = 10;
  DOM.barSocial.style.width = clampPercent(gameState.social, maxStat);
  DOM.barAcademics.style.width = clampPercent(gameState.academic, maxStat);
  DOM.barBurnout.style.width = clampPercent(maxStat - gameState.burnout, maxStat);
}

function populateSocial() {
  const girlfriend = GIRLFRIEND_MAP[gameState.girlfriendId];

  // Always populate from data (0 = nobody, 1 = Tiffany, 9 = failure)
  if (girlfriend) {
    document.getElementById("girlfriend-name").textContent = girlfriend.name;
    document.getElementById("girlfriend-subtitle").innerHTML = "<u>" + girlfriend.subtitle + "</u>";
    document.getElementById("girlfriend-bio").textContent = girlfriend.bio;
    
    // Archetype and tooltip (hide if no archetype)
    const gfArchetype = document.getElementById("girlfriend-archetype");
    const gfTooltip = document.getElementById("girlfriend-tooltip");
    if (girlfriend.archetype) {
      gfArchetype.parentElement.parentElement.style.display = "block";
      gfArchetype.textContent = girlfriend.archetype;
      gfTooltip.textContent = girlfriend.tooltip || "";
    } else {
      gfArchetype.parentElement.parentElement.style.display = "none";
    }
  }

  // Only show fondness bar if girlfriendId in [1,8] (actual romance, not 0=nobody or 9=failure)
  const fondnessSection = document.querySelector(".fondness-section");
  if (gameState.girlfriendId >= 1 && gameState.girlfriendId <= 8) {
    fondnessSection.style.display = "block";
    DOM.fondnessText.textContent = getTier(gameState.fondness, FONDNESS_TIERS);
    DOM.barFondness.style.width = clampPercent(gameState.fondness, 10);
  } else {
    fondnessSection.style.display = "none";
  }

  // Best friend
  const bestFriend = BESTFRIEND_MAP[gameState.bestFriendId];
  if (bestFriend) {
    document.getElementById("bestfriend-name").textContent = bestFriend.name;
    document.getElementById("bestfriend-archetype").textContent = bestFriend.archetype;
    document.getElementById("bestfriend-tooltip").textContent = bestFriend.tooltip || "";
    document.getElementById("bestfriend-desc").textContent = bestFriend.desc;
  }

  // Roommate
  const roommate = ROOMMATE_MAP[gameState.roommateId];
  if (roommate) {
    document.getElementById("roommate-name").textContent = roommate.name;
    document.getElementById("roommate-archetype").textContent = roommate.archetype;
    document.getElementById("roommate-tooltip").textContent = roommate.tooltip || "";
    document.getElementById("roommate-desc").textContent = roommate.desc;
  }

  // Leaning bar - center-out bidirectional
  const leaning = gameState.leaning;
  const maxLeaning = 4;
  const clampedLeaning = Math.max(-maxLeaning, Math.min(maxLeaning, leaning));
  
  // Update leaning bar end labels with actual character names
  const leftLabel = document.getElementById("leaning-left-label");
  const rightLabel = document.getElementById("leaning-right-label");
  if (leftLabel && bestFriend) leftLabel.textContent = bestFriend.name;
  if (rightLabel && roommate) rightLabel.textContent = roommate.name;
  
  // Update text label with actual character name
  if (clampedLeaning < 0) {
    DOM.leaningText.textContent = bestFriend ? bestFriend.name : "Best Friend";
  } else if (clampedLeaning > 0) {
    DOM.leaningText.textContent = roommate ? roommate.name : "Roommate";
  } else {
    DOM.leaningText.textContent = "Neutral";
  }
  
  // Calculate fill percentages (50% = full bar on one side)
  const leftPercent = clampedLeaning < 0 ? (Math.abs(clampedLeaning) / maxLeaning) * 50 : 0;
  const rightPercent = clampedLeaning > 0 ? (clampedLeaning / maxLeaning) * 50 : 0;
  
  if (DOM.barLeaningLeft) DOM.barLeaningLeft.style.width = leftPercent + "%";
  if (DOM.barLeaningRight) DOM.barLeaningRight.style.width = rightPercent + "%";
}



function endGame(endingCode) {
  fetch("endings.json")
    .then(res => res.json())
    .then(data => {
      const ending = data.endings.find(e => e.code === endingCode);
      if (ending) {
        currentEnding = ending;
        DOM.endingTitle.innerText = ending.title;
        DOM.endingSubtitle.innerText = ending.subtitle;
        DOM.endingText.innerText = ending.s1;
        switchSlide("ending-slide-1");
      } else {
        console.warn("Ending not found in endings.json");
        alert("Game Over.");
      }
    })
    .catch(err => {
      console.error("Error fetching endings.json:", err);
      alert("Game Over.");
    });
}

function nextEndingSlide() {
  if (currentEnding) {
    DOM.finalText.innerText = currentEnding.s2;
    switchSlide("ending-slide-2");
  }
}


function restartGame() {
  window.location.href = "index.html";
}


window.onload = loadGameData;