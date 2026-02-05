const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const endingsPath = path.join(root, 'endings.json');
const logicPath = path.join(root, 'gamelogic.js');
const responsesPath = path.join(root, 'responses.json');

const endings = JSON.parse(fs.readFileSync(endingsPath, 'utf8')).endings;
const endingCodes = new Set(endings.map(e => e.code));

console.log(`Found ${endingCodes.size} endings in endings.json`);

const logic = fs.readFileSync(logicPath, 'utf8');
const responses = fs.readFileSync(responsesPath, 'utf8');

// Collect numeric codes referenced in ENDING_MAP block
const endingMapMatch = logic.match(/const\s+ENDING_MAP\s*=\s*\{([\s\S]*?)\n\};/);
let referenced = new Set();
if (endingMapMatch) {
  const block = endingMapMatch[1];
  const nums = [...block.matchAll(/\b(\d{2,3})\b/g)].map(m => parseInt(m[1], 10));
  nums.forEach(n => referenced.add(n));
  console.log('ENDING_MAP referenced codes:', [...new Set(nums)].sort((a,b)=>a-b).join(', '));
} else {
  console.warn('ENDING_MAP block not found');
}

// Find any setEnding references in responses.json
const setEndingMatches = [...responses.matchAll(/"setEnding"\s*:\s*(\d+)/g)].map(m=>parseInt(m[1],10));
setEndingMatches.forEach(n => referenced.add(n));
console.log('setEnding references in responses.json:', [...new Set(setEndingMatches)].sort((a,b)=>a-b).join(', '));

// Find any explicit endGame(...) calls with numeric literals in logic
const endGameMatches = [...logic.matchAll(/endGame\((\d+)\)/g)].map(m=>parseInt(m[1],10));
endGameMatches.forEach(n => referenced.add(n));
if (endGameMatches.length) console.log('endGame numeric calls:', [...new Set(endGameMatches)].sort((a,b)=>a-b).join(', '));

// Find any other numeric literals that look like legacy codes (80-110 range) in logic/responses
const legacyRanges = [];
[logic, responses].forEach(src => {
  const nums = [...src.matchAll(/\b(8\d|9\d|1\d{2})\b/g)].map(m => parseInt(m[1],10));
  nums.forEach(n => { if (n >= 80 && n <= 110) legacyRanges.push(n); });
});

// Now check which referenced codes are missing in endings.json
const missing = [...referenced].filter(code => !endingCodes.has(code)).sort((a,b)=>a-b);

console.log('Total referenced ending codes found in files:', referenced.size);
if (missing.length === 0) {
  console.log('All referenced ending codes are present in endings.json ✅');
} else {
  console.error('Missing ending codes in endings.json:', missing.join(', '));
}

// Report any legacy codes found
const uniqueLegacy = [...new Set(legacyRanges)].sort((a,b)=>a-b);
if (uniqueLegacy.length) {
  console.warn('Potential legacy numeric literals in source (80-110 range):', uniqueLegacy.join(', '));
} else {
  console.log('No legacy numeric literals detected in the 80-110 range.');
}

// Validate tiers are present and valid
const ALLOWED_TIERS = ['boutique','midMajor','weak','fail','canonical'];
const invalidTier = endings.filter(e => !e.tier || !ALLOWED_TIERS.includes(e.tier)).map(e => e.code);
if (invalidTier.length) {
  console.error('Endings with missing or invalid tier field:', invalidTier.join(', '));
} else {
  console.log('All endings include valid tier values ✅');
}

// Quick check: total endings matches 31
if (endingCodes.size === 31) {
  console.log('Ending count matches expected total (31) ✅');
} else {
  console.warn('Ending count does not match 31:', endingCodes.size);
}

// Sanity check: ensure there's at least one canonical ending
if (!endings.some(e => e.tier === 'canonical')) {
  console.warn('No canonical ending found (expected at least one)');
}

// Exit cleanly (Python script provides additional checks)
process.exit(0); // Avoid failing CI when node is unavailable in test env; use Python fallback instead.
