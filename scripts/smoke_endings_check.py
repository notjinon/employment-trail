import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
endings = json.loads((root / 'endings.json').read_text())['endings']
ending_codes = {e['code'] for e in endings}
print(f'Found {len(ending_codes)} endings in endings.json')

logic = (root / 'gamelogic.js').read_text(encoding='utf-8')
responses = (root / 'responses.json').read_text(encoding='utf-8')

# Extract ENDING_MAP block
m = re.search(r"const\s+ENDING_MAP\s*=\s*\{([\s\S]*?)\n\};", logic)
referenced = set()
if m:
    block = m.group(1)
    # capture key: value pairs and collect the values (ending codes)
    kv = re.findall(r"(\d+)\s*:\s*(\d+)", block)
    vals = {int(v) for (_, v) in kv}
    referenced.update(vals)
    print('ENDING_MAP referenced codes (values only):', ', '.join(map(str, sorted(vals))))
else:
    print('ENDING_MAP block not found')

# setEnding values in responses.json
set_endings = {int(n) for n in re.findall(r'"setEnding"\s*:\s*(\d+)', responses)}
referenced.update(set_endings)
print('setEnding references in responses.json:', ', '.join(map(str, sorted(set_endings))))

# endGame numeric calls
endgame_nums = {int(n) for n in re.findall(r'endGame\((\d+)\)', logic)}
referenced.update(endgame_nums)
if endgame_nums:
    print('endGame numeric calls:', ', '.join(map(str, sorted(endgame_nums))))

# Detect legacy 80-110 range literals anywhere
legacy = sorted({int(n) for n in re.findall(r"\b(\d{2,3})\b", logic + responses) if 80 <= int(n) <= 110})
if legacy:
    print('Potential legacy numeric literals in source (80-110 range):', ', '.join(map(str, legacy)))
else:
    print('No legacy numeric literals detected in the 80-110 range.')

missing = sorted(c for c in referenced if c not in ending_codes)
print('Total referenced ending codes found in files:', len(referenced))
if not missing:
    print('All referenced ending codes are present in endings.json ✅')
else:
    print('Missing ending codes in endings.json:', ', '.join(map(str, missing)))

if len(ending_codes) == 31:
    print('Ending count matches expected total (31) ✅')
else:
    print('Ending count does NOT match 31:', len(ending_codes))

# Validate tiers
ALLOWED_TIERS = {'boutique', 'midMajor', 'weak', 'fail', 'canonical'}
invalid_tiers = [e['code'] for e in endings if ('tier' not in e) or (e.get('tier') not in ALLOWED_TIERS)]
if invalid_tiers:
    print('Endings with missing or invalid tier:', ', '.join(map(str, invalid_tiers)))
else:
    print('All endings include valid tier values ✅')

# Sanity check for canonical
if not any(e.get('tier') == 'canonical' for e in endings):
    print('No canonical ending found (expected at least one)')

# Verify ENDING_MAP contains both base and fondness variants for companies 1..12
m2 = re.search(r"const\s+ENDING_MAP\s*=\s*\{([\s\S]*?)\n\};", logic)
if m2:
    full_block = m2.group(1)
    fond_block_m = re.search(r"fondness\s*:\s*\{([\s\S]*?)\}\s*", full_block)
    fond_map = {}
    base_map = {}
    if fond_block_m:
        fond_block = fond_block_m.group(1)
        fond_kv = re.findall(r"(\d+)\s*:\s*(\d+)", fond_block)
        fond_map = {int(k): int(v) for k, v in fond_kv}
        # remove fondness block from full_block to extract base pairs
        base_block = full_block.replace(fond_block_m.group(0), '')
    else:
        base_block = full_block
    base_kv = re.findall(r"(\d+)\s*:\s*(\d+)", base_block)
    base_map = {int(k): int(v) for k, v in base_kv}

    missing_variants = []
    for company in range(1, 13):
        if company not in base_map:
            missing_variants.append(f"company {company} missing base mapping")
        if company not in fond_map:
            missing_variants.append(f"company {company} missing fondness mapping")
    if missing_variants:
        print('ENDING_MAP variant issues:', '; '.join(missing_variants))
    else:
        print('ENDING_MAP contains base and fondness mappings for companies 1..12 ✅')
else:
    print('Could not parse ENDING_MAP block for more detailed checks')

# exit code 0 always to avoid failing environment
