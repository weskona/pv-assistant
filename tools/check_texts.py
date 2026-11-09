#!/usr/bin/env python3
"""Checks the panel texts: German and English have the same keys, every key used in the code exists, none is unused."""

import re
import sys
from pathlib import Path

FRONTEND = Path(__file__).resolve().parent.parent / "custom_components/pv_assistant/frontend"
texts = (FRONTEND / "pv-assistant-texts.js").read_text(encoding="utf-8")
# all modules together: a text may be used in any of them
text = "\n".join(f.read_text(encoding="utf-8") for f in sorted(FRONTEND.glob("*.js")))

start = texts.index("const T = {")
de = texts.index("  de: {", start)
en = texts.index("  en: {", de)
end = texts.index("\n};", en)


def keys_of(block: str) -> set[str]:
    """Property names of an object literal, ignoring everything inside strings."""
    found, i, depth = set(), 0, 0
    while i < len(block):
        c = block[i]
        if c in "\"'`":  # skip the string
            j = i + 1
            while block[j] != c:
                j += 2 if block[j] == "\\" else 1
            i = j + 1
            continue
        if c in "{[(":
            depth += 1
        elif c in "}])":
            depth -= 1
        elif depth == 1 and (c.isalpha() or c == "_") and not (block[i - 1].isalnum() or block[i - 1] == "_"):
            m = re.match(r"([A-Za-z_][A-Za-z0-9_]*)\s*:", block[i:])
            if m:
                found.add(m.group(1))
                i += len(m.group(1))
                continue
        i += 1
    return found


keys = {"de": keys_of(texts[de + 6 : en]), "en": keys_of(texts[en + 6 : end])}

errors = []
for a, b in (("de", "en"), ("en", "de")):
    for k in sorted(keys[a] - keys[b]):
        errors.append(f"text '{k}' exists in {a} but not in {b}")

used = set(re.findall(r"_t\(\"([A-Za-z0-9_]+)\"\)", text))
for k in sorted(used - (keys["de"] & keys["en"])):
    errors.append(f"text '{k}' is used in the code but missing")

# a key that appears nowhere but in its two definitions is dead (keys used dynamically show up as a plain word elsewhere)
for k in sorted(keys["de"] & keys["en"]):
    if len(re.findall(rf"\b{k}\b", text)) <= 2:
        errors.append(f"text '{k}' is never used")

if errors:
    print("\n".join(errors))
    sys.exit(1)
print(f"{len(keys['de'])} texts, de and en match")
