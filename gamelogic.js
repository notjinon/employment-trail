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
  { max: 7, label: "\"Aren't you in my class?\"" },
  { max: 10, label: "\"You're not that ugly.\"" },
  { max: Infinity, label: "\"We're getting married!\"" }
];

// Branch rules - key: function that returns next question key
const BRANCH_RULES = {
  108000: (g) => g.burnout < 4 ? 108100 : 108200,
  110000: (g) => g.academic > 3 ? 110100 : 110200,
  113000: (g) => {
    // Leaning checkpoint - if too far in either direction, a friend leaves
    if (g.leaning >= 3) return 113300; // Tara leaves (too Chen-aligned)
    if (g.leaning <= -3) return 113400; // Chen leaves (too Tara-aligned)
    // Normal dinner variants based on social
    return g.social >= 5 ? 113100 : 113200;
  },
  114000: () => 114100,
  115000: (g) => g.burnout < 4 ? 115100 : 115200,
  116000: (g) => {
    // If there's no girlfriend (0) or the failed-gf state (9), skip the date scene
    if (!g.girlfriendId || g.girlfriendId === 9) return 117000;
    
    // Base requirement: fondness >= 6
    if (g.fondness < 7) return 116200;
    
    // Girlfriend-specific requirements for successful date
    if (g.girlfriendId === 1) { // Tiffany - needs academic >= 7
      return g.academic >= 7 ? 116100 : 116200;
    } else if (g.girlfriendId === 2) { // Ezra - needs burnout <= 5
      return g.burnout <= 5 ? 116100 : 116200;
    } else if (g.girlfriendId === 3) { // Jenny - needs social >= 7
      return g.social >= 7 ? 116100 : 116200;
    }
    
    // exception handling
    return g.fondness >= 7 ? 116100 : 116200;
  },
  117000: (g) => {
    // Failstate skips interview prep - go to failstate Q17
    const hasGF = g.girlfriendId >= 1 && g.girlfriendId <= 8 && g.girlfriendId !== 9;
    const fondEnough = g.fondness >= 10 && hasGF;
    if (g.failstate) {
      if (fondEnough) return 117500; // Failstate with girlfriend
      return 117600; // Failstate alone
    }
    if (fondEnough && g.burnout < 2) return 117100;
    if (fondEnough) return 117200;
    if (g.burnout < 2) return 117300;
    return 117400;
  },
  118000: (g) => {
    // Failstate skips interview - go to failstate Q18
    const hasGF = g.girlfriendId >= 1 && g.girlfriendId <= 8 && g.girlfriendId !== 9;
    const fondEnough = g.fondness >= 10 && hasGF;
    if (g.failstate) {
      if (fondEnough) return 118500; // Failstate with girlfriend
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
    const hasGF = g.girlfriendId >= 1 && g.girlfriendId <= 8 && g.girlfriendId !== 9;
    const fondEnough = g.fondness >= 10 && hasGF;
    if (g.failstate) {
      if (fondEnough && g.academic >= 5) return 121500; // gf + research option
      if (fondEnough) return 121600; // gf only
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
  // Boutique tier endings (no partner base -> partner fondness variant)
  1: 206, 2: 202, 3: 204, 4: 208,
  // Mid-major tier endings
  5: 214, 6: 210, 7: 212, 8: 216,
  // Weak tier endings
  9: 222, 10: 218, 11: 220, 12: 224,
  // Fondness variants (partner Yes)
  fondness: {
    1: 205, 2: 201, 3: 203, 4: 207,
    5: 213, 6: 209, 7: 211, 8: 215,
    9: 221, 10: 217, 11: 219, 12: 223
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
  DOM.endingNumber = document.getElementById("ending-number");
  DOM.endingText = document.getElementById("ending-text");
  DOM.finalText = document.getElementById("final-text");
  // New ending UI elements
  DOM.endingBullets = document.getElementById("ending-bullets");
  DOM.endingGrade = document.getElementById("ending-grade");
  DOM.endingStats = document.getElementById("ending-stats");
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
  bestFriendId: 0,
  roommateId: 0,
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
  if (!document.getElementById("question-slide").classList.contains("hidden")) {
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
  } else if (!document.getElementById("feedback-slide").classList.contains("hidden")) {
    // Handle Enter key as next on feedback slide
    if (event.key === "Enter") {
      nextQuestion();
      event.preventDefault();
      return;
    }
  } else if (!document.getElementById("ending-slide-1").classList.contains("hidden") ||
             !document.getElementById("ending-slide-2").classList.contains("hidden") ||
             !document.getElementById("ending-slide-3").classList.contains("hidden")) {
    // Handle Enter key as next on ending slides
    if (event.key === "Enter") {
      nextEndingSlide();
      event.preventDefault();
      return;
    }
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
        // If the effect is an ID (bestFriendId, roommateId, girlfriendId, etc.), set it directly
        if (/Id$/.test(stat)) {
          gameState[stat] = response.effects[stat];
          console.debug(`Set ${stat} = ${response.effects[stat]}`);
        } else {
          gameState[stat] += response.effects[stat];
        }
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
    const hasGF = gameState.girlfriendId >= 1 && gameState.girlfriendId <= 8 && gameState.girlfriendId !== 9;
    gameState.ending = (fondness >= 10 && hasGF) ? ENDING_MAP.fondness[company] : base;
    currentResponseId = 120101;
  } else {
    currentResponseId = 120102;
  }
}

function handleFallbackEndings(optKey) {
  const endingPairs = {
    // Local internship options -> Municipal: Partner No (226), Partner Yes (225)
    121101: { base: 226, fondness: 225 },
    121201: { base: 226, fondness: 225 },
    // Research options -> Paid Research: Partner No (228), Partner Yes (227)
    121102: { base: 228, fondness: 227 },
    121301: { base: 228, fondness: 227 }
  };

  if (endingPairs[optKey]) {
    const pair = endingPairs[optKey];
    currentResponseId = [121101, 121201].includes(optKey) ? 121101 : 121102;
    const hasGF = gameState.girlfriendId >= 1 && gameState.girlfriendId <= 8 && gameState.girlfriendId !== 9;
    gameState.ending = (gameState.fondness >= 10 && hasGF) ? pair.fondness : pair.base;
  } else {
    currentResponseId = 121103;
    // Fallback: breathing room (with partner => Fresh Breaths 229) else canonical Dreams Deferred (18)
    const hasGF = gameState.girlfriendId >= 1 && gameState.girlfriendId <= 8 && gameState.girlfriendId !== 9;
    gameState.ending = (gameState.fondness >= 10 && hasGF) ? 229 : 18;
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

  // Allow numeric-ish strings; keep 'ending' special case
  if (nextKey !== "ending" && !isNaN(Number(nextKey))) nextKey = Number(nextKey);

  // Handle "ending" as a special nextQuestion value
  if (nextKey === "ending") {
    console.error("Reached 'ending' nextQuestion without setEnding - defaulting to canonical ending");
    endGame(18);
    return;
  }

  // Apply branching rules if applicable (branch keys like 117000 map to real 117100+ keys)
  if (BRANCH_RULES[nextKey]) {
    nextKey = BRANCH_RULES[nextKey](gameState);
  }

  const nextQuestion = questions[nextKey];
  if (!nextQuestion) {
    console.error(`Question with key ${nextKey} not found. BRANCH_RULES keys: ${Object.keys(BRANCH_RULES).join(', ')}`);
    // As a recovery, if this was meant to be a branching key, try applying BRANCH_RULES using numeric coercion
    if (BRANCH_RULES[nextKey]) {
      nextKey = BRANCH_RULES[nextKey](gameState);
      if (questions[nextKey]) {
        currentQuestionKey = nextKey;
        showQuestion();
        return;
      }
    }
    // Final fallback: go to canonical ending to avoid dead state
    console.warn('Falling back to canonical ending (code 18)');
    endGame(18);
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
    
    // Load portrait from JSON if available
    const gfPortrait = document.getElementById("girlfriend-portrait");
    if (girlfriend.portrait && gfPortrait) {
      const img = document.createElement("img");
      img.src = girlfriend.portrait;
      img.alt = girlfriend.name;
      gfPortrait.innerHTML = "";
      gfPortrait.appendChild(img);
    }
    
    // Archetype and tooltip (hide if no archetype) — tooltip now anchored on name
    const gfNameEl = document.getElementById("girlfriend-name");
    const gfArchetype = document.getElementById("girlfriend-archetype");
    const gfTooltip = document.getElementById("girlfriend-tooltip");
    const gfTooltipWrapper = gfNameEl ? gfNameEl.parentElement : null;
    if (girlfriend.archetype) {
      // Only hide/show the archetype paragraph, not the entire card content
      if (gfArchetype && gfArchetype.parentElement) gfArchetype.parentElement.style.display = "block";
      gfArchetype.textContent = girlfriend.archetype;
      if (gfTooltip) { gfTooltip.textContent = girlfriend.tooltip || ""; gfTooltip.style.display = gfTooltip.textContent ? "" : "none"; }
      if (gfTooltipWrapper) gfTooltipWrapper.style.cursor = (gfTooltip && gfTooltip.textContent) ? "help" : "default";
    } else {
      if (gfArchetype && gfArchetype.parentElement) gfArchetype.parentElement.style.display = "none";
      if (gfTooltip) { gfTooltip.textContent = ""; gfTooltip.style.display = "none"; }
      if (gfTooltipWrapper) gfTooltipWrapper.style.cursor = "default";
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
  const bfNameEl = document.getElementById("bestfriend-name");
  const bfArcheEl = document.getElementById("bestfriend-archetype");
  const bfTooltipEl = document.getElementById("bestfriend-tooltip");
  const bfDescEl = document.getElementById("bestfriend-desc");
  const bfTooltipWrapper = bfNameEl ? bfNameEl.parentElement : null;
  if (bestFriend) {
    bfNameEl.textContent = bestFriend.name;
    bfArcheEl.textContent = bestFriend.archetype;
    bfDescEl.textContent = bestFriend.desc;
    
    // Load portrait from JSON if available
    const bfPortrait = document.getElementById("bestfriend-portrait");
    if (bestFriend.portrait && bfPortrait) {
      const img = document.createElement("img");
      img.src = bestFriend.portrait;
      img.alt = bestFriend.name;
      bfPortrait.innerHTML = "";
      bfPortrait.appendChild(img);
    }
    
    if (bfTooltipEl) { bfTooltipEl.textContent = bestFriend.tooltip || ""; bfTooltipEl.style.display = ""; }
    if (bfTooltipWrapper) bfTooltipWrapper.style.cursor = "help";
  } else {
    bfNameEl.textContent = "???";
    bfArcheEl.textContent = "???";
    bfDescEl.textContent = "";
    if (bfTooltipEl) { bfTooltipEl.textContent = ""; bfTooltipEl.style.display = "none"; }
    if (bfTooltipWrapper) bfTooltipWrapper.style.cursor = "default";
  }

  // Roommate
  const roommate = ROOMMATE_MAP[gameState.roommateId];
  const rmNameEl = document.getElementById("roommate-name");
  const rmArcheEl = document.getElementById("roommate-archetype");
  const rmTooltipEl = document.getElementById("roommate-tooltip");
  const rmDescEl = document.getElementById("roommate-desc");
  const rmTooltipWrapper = rmNameEl ? rmNameEl.parentElement : null;
  if (roommate) {
    rmNameEl.textContent = roommate.name;
    rmArcheEl.textContent = roommate.archetype;
    rmDescEl.textContent = roommate.desc;
    
    // Load portrait from JSON if available
    const rmPortrait = document.getElementById("roommate-portrait");
    if (roommate.portrait && rmPortrait) {
      const img = document.createElement("img");
      img.src = roommate.portrait;
      img.alt = roommate.name;
      rmPortrait.innerHTML = "";
      rmPortrait.appendChild(img);
    }
    
    if (rmTooltipEl) { rmTooltipEl.textContent = roommate.tooltip || ""; rmTooltipEl.style.display = ""; }
    if (rmTooltipWrapper) rmTooltipWrapper.style.cursor = "help";
  } else {
    rmNameEl.textContent = "???";
    rmArcheEl.textContent = "???";
    rmDescEl.textContent = "";
    if (rmTooltipEl) { rmTooltipEl.textContent = ""; rmTooltipEl.style.display = "none"; }
    if (rmTooltipWrapper) rmTooltipWrapper.style.cursor = "default";
  }

  // Leaning bar - center-out bidirectional
  const leaning = gameState.leaning;
  const maxLeaning = 3;
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
  // Calculate fill percentages (100% = full bar on one side)
  const leftPercent = clampedLeaning < 0 ? (Math.abs(clampedLeaning) / maxLeaning) * 100 : 0;
  const rightPercent = clampedLeaning > 0 ? (clampedLeaning / maxLeaning) * 100 : 0;
  
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
        // Show narrative first
        DOM.endingText.innerText = ending.s1 || '';
        if (ending.number) {
          DOM.endingNumber.innerText = `Ending ${String(ending.number).padStart(2, '0')}/31`;
          DOM.endingNumber.style.display = "";
        } else {
          if (DOM.endingNumber) DOM.endingNumber.style.display = "none";
        }
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
  if (!currentEnding) return;

  const s1Visible = !document.getElementById('ending-slide-1').classList.contains('hidden');
  const s2Visible = !document.getElementById('ending-slide-2').classList.contains('hidden');
  const s3Visible = !document.getElementById('ending-slide-3').classList.contains('hidden');

  if (s1Visible) {
    // Move to slice-of-life slide (s2) - render as IRC chat
    renderIRCMessages(currentEnding.s2 || '');
    switchSlide('ending-slide-2');
    return;
  }

  if (s2Visible) {
    // Prepare and show scorecard (s3)
    try {
      renderEndingDetails(currentEnding, gameState);
    } catch (err) {
      console.error('Error rendering scorecard:', err);
    }
    switchSlide('ending-slide-3');
    return;
  }

  if (s3Visible) {
    // Show thanks slide (s4)
    switchSlide('ending-slide-4');
    return;
  }
}


// Compute a numeric score from tier + modifiers, then map to A/B/C/D/F
// Scoring rules (data-driven):
// tier: boutique=+85, midmajor=+75, weak=+65, fail=+55, canonical=+50 (default low)
// modifiers: girlfriend (fondness>=10) = +10, no conflict with friends = +5
// grade thresholds: A >=90, B >=80, C >=70, D >=60, F >=50
function computeGrade(ending, g) {
  const tier = (ending.tier || '').toLowerCase();
  const tierPoints = {
    'boutique': 85,
    'midmajor': 75,
    'midmajor': 75,
    'weak': 65,
    'fail': 55,
    'canonical': 50
  };

  const base = tierPoints[tier] ?? 65; // default to 65 if unknown
  let score = base;

  // Girlfriend bonus
  if (g.fondness >= 10) score += 10;

  // No-conflict bonus: only if BOTH best friend and roommate codes are 1
  // (per spec: iff they are both 1, give +5)
  const noConflict = (g.bestFriendId === 1 && g.roommateId === 1);
  if (noConflict) score += 5;

  // Clamp to [0,100]
  score = Math.max(0, Math.min(100, score));

  // Map numeric score to letter grade
  let letter;
  if (score >= 90) letter = 'A';
  else if (score >= 80) letter = 'B';
  else if (score >= 70) letter = 'C';
  else if (score >= 60) letter = 'D';
  else letter = 'F';

  return { letter, score };
}

// Parse and render IRC-style chat messages from s2 text
function renderIRCMessages(s2Text) {
  const logContainer = document.getElementById('irc-message-log');
  if (!logContainer) return;
  
  logContainer.innerHTML = '';
  
  // Split by lines
  const lines = s2Text.split('\n').filter(line => line.trim());
  
  // Generate random base time (23:XX)
  let minutes = Math.floor(Math.random() * 60);
  
  lines.forEach((line, index) => {
    // Parse "Speaker: message" format
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (!match) return;
    
    const speaker = match[1].trim();
    const message = match[2].trim();
    
    // Generate timestamp (increment by 1-3 minutes per message)
    const timestamp = `23:${String(minutes).padStart(2, '0')}`;
    minutes = (minutes + Math.floor(Math.random() * 3) + 1) % 60;
    
    // Determine nick class
    let nickClass = '';
    if (speaker.toLowerCase() === 'you') {
      nickClass = 'you';
    } else if (speaker.toLowerCase().includes('friend')) {
      nickClass = 'friend';
    } else if (speaker.toLowerCase().includes('roommate')) {
      nickClass = 'roommate';
    }
    
    // Create message element
    const msgDiv = document.createElement('div');
    msgDiv.className = 'irc-message';
    
    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'irc-timestamp';
    timestampSpan.textContent = timestamp;
    
    const nickSpan = document.createElement('span');
    nickSpan.className = `irc-nick ${nickClass}`;
    nickSpan.textContent = `<${speaker}>`;
    
    const textSpan = document.createElement('span');
    textSpan.className = 'irc-text';
    textSpan.textContent = message;
    
    msgDiv.appendChild(timestampSpan);
    msgDiv.appendChild(nickSpan);
    msgDiv.appendChild(textSpan);
    
    logContainer.appendChild(msgDiv);
  });
  
  // Scroll to bottom
  logContainer.scrollTop = logContainer.scrollHeight;
}

function renderEndingDetails(ending, g) {
  const bullets = [];

  // Girlfriend detection
  if (g.fondness >= 10) {
    bullets.push('Got Girlfriend (+XX)');
  } else {
    bullets.push('No Girlfriend (-XX)');
  }

  // Tier-based bullet (determine once)
  const endingTier = (ending.tier || '').toLowerCase();
  if (endingTier === 'boutique') bullets.push('Boutique internship (+XX)');
  else if (endingTier === 'midmajor' || endingTier === 'midMajor') bullets.push('Mid-major internship (+XX)');
  else if (endingTier === 'weak') bullets.push('Local internship (+XX)');
  else if (endingTier === 'fail') bullets.push('Failstate outcome');
  else bullets.push('Outcome: ' + (ending.subtitle || 'Unknown'));

  // Show bullets with explicit point values where appropriate
  if (g.fondness >= 10) {
    // display exact bonus
    bullets[0] = `Got Girlfriend (+10)`;
  } else {
    bullets[0] = `No Girlfriend (+0)`;
  }

  // Tier bullet with explicit points
  const tierLabelMap = {
    'boutique': ['Boutique internship', 85],
    'midmajor': ['Mid-major internship', 75],
    'weak': ['Local internship', 65],
    'fail': ['Failstate outcome', 55],
    'canonical': ['Canonical outcome', 50]
  };
  const tierInfo = tierLabelMap[endingTier] || ['Outcome', 65];
  bullets[1] = `${tierInfo[0]} (+${tierInfo[1]})`;

  // Conflict detection bullet
  // Conflict bonus only if BOTH best friend and roommate codes are 1
  if (g.bestFriendId === 1 && g.roommateId === 1) {
    bullets[2] = 'Both friends okay (+5)';
  } else {
    bullets[2] = 'One friend lost (-0)';
  }

  if (DOM.endingBullets) {
    DOM.endingBullets.innerHTML = bullets.map(b => `<li>${b}</li>`).join('');
  }

  // Compute and display grade (letter + numeric score)
  const gradeResult = computeGrade(ending, g);
  if (DOM.endingGrade) {
    DOM.endingGrade.textContent = `${gradeResult.letter} (${gradeResult.score})`;
    DOM.endingGrade.setAttribute('data-score', gradeResult.score);
    DOM.endingGrade.title = `Computed score: ${gradeResult.score}`;
  }

  // Friendly stats
  const companyName = COMPANY_MAP[g.company] || (g.company === 0 ? 'No Offer' : 'Unknown');
  const gfName = (GIRLFRIEND_MAP[g.girlfriendId] || {}).name || 'None';
  const bfName = (BESTFRIEND_MAP[g.bestFriendId] || {}).name || 'None';
  const rmName = (ROOMMATE_MAP[g.roommateId] || {}).name || 'None';

  const stats = {
    School: SCHOOL_MAP[g.school] || 'Unknown',
    Company: companyName,
    'Fondness': g.fondness,
    'Burnout': g.burnout,
    'Academics': g.academic,
    'Social': g.social,
    'Best Friend': bfName,
    'Roommate': rmName
  };

  if (DOM.endingStats) {
    DOM.endingStats.textContent = Object.entries(stats).map(([k,v]) => `${k}: ${v}`).join('\n');
  }
}

function restartGame() {
  window.location.href = "index.html";
}


window.onload = loadGameData;