#!/usr/bin/env python3
"""Extract small local-only OALD references for WordFlow.

The generated JS file and audio directory are intentionally git-ignored.
They are for the user's local browser only; do not publish OALD content or
audio to a public GitHub Pages repo.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import subprocess
from pathlib import Path

from bs4 import BeautifulSoup
from readmdict import MDD, MDX


DEFAULT_MDX = Path("/Users/hanvzb/Library/Mobile Documents/com~apple~CloudDocs/Downloads/ox/oald.mdx")
DEFAULT_MDDS = [
    Path("/Users/hanvzb/Library/Mobile Documents/com~apple~CloudDocs/Downloads/ox/oald.1.mdd"),
    Path("/Users/hanvzb/Library/Mobile Documents/com~apple~CloudDocs/Downloads/ox/oald.2.mdd"),
    Path("/Users/hanvzb/Library/Mobile Documents/com~apple~CloudDocs/Downloads/ox/oald.3.mdd"),
    Path("/Users/hanvzb/Library/Mobile Documents/com~apple~CloudDocs/Downloads/ox/oald.4.mdd"),
    Path("/Users/hanvzb/Library/Mobile Documents/com~apple~CloudDocs/Downloads/ox/oald.mdd"),
]
DEFAULT_OUT = Path("data/oald-local-overrides.generated.js")
DEFAULT_AUDIO_DIR = Path("assets/oald-audio")
OALD_ALIASES = {
    "administrate": "administer",
    "habituate": "habituation",
    "madame": "madam",
    "thriftless": "thrift",
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mdx", default=str(DEFAULT_MDX))
    parser.add_argument("--mdd", default=",".join(str(path) for path in DEFAULT_MDDS))
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    parser.add_argument("--audio-dir", default=str(DEFAULT_AUDIO_DIR))
    parser.add_argument("--words", default="")
    parser.add_argument("--from-bank", action="store_true", help="Read all kaoyan word ids from WordFlow's merged bank.")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--extract-audio", action="store_true")
    args = parser.parse_args()

    words = load_words(args.words, args.limit, args.from_bank)
    entries = read_mdx(Path(args.mdx), words)
    audio_index = {}
    if args.extract_audio:
        audio_index = extract_audio([Path(item) for item in args.mdd.split(",") if item], entries, Path(args.audio_dir))

    output = {}
    for word, entry in entries.items():
      audio = audio_index.get(word, "")
      output[word] = {
          "phonetic": entry["phonetic"],
          "oaldDefinition": entry["definition"],
          "oaldAudioRef": entry["audio_ref"],
      }
      if entry.get("lookup") and entry["lookup"] != word:
          output[word]["oaldLookup"] = entry["lookup"]
      if entry.get("audio_ref_us"):
          output[word]["oaldAudioRefUs"] = entry["audio_ref_us"]
      if audio:
          output[word]["audio"] = {"uk": audio}

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        "window.KAOYAN_OALD_LOCAL = "
        + json.dumps(output, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )
    missing_entries = [word for word in words if word not in output]
    missing_audio = [word for word, entry in entries.items() if entry.get("audio_ref") and not audio_index.get(word)]
    no_audio_ref = [word for word, entry in entries.items() if not entry.get("audio_ref")]
    print(json.dumps({
        "requested": len(words),
        "matched": len(output),
        "audioExtracted": sum(1 for value in audio_index.values() if value),
        "missingEntries": missing_entries[:30],
        "missingEntryCount": len(missing_entries),
        "missingAudio": missing_audio[:30],
        "missingAudioCount": len(missing_audio),
        "noAudioRef": no_audio_ref[:30],
        "noAudioRefCount": len(no_audio_ref),
        "out": str(out_path)
    }, ensure_ascii=False, indent=2))


def load_words(words_arg: str, limit: int, from_bank: bool) -> list[str]:
    if words_arg:
        words = [item.strip().lower() for item in words_arg.split(",") if item.strip()]
    elif from_bank:
        script = """
const fs = require("node:fs");
const vm = require("node:vm");
const sandbox = { window: {}, console };
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);
[
  "data/kaoyan-core-pack.js",
  "data/kaoyan-extended-pack.js",
  "data/kaoyan-complete-pack.js",
  "data/kaoyan-syllabus-recognition-pack.js",
  "data/pastpapers-index.js",
  "data/pastpapers-vocab-stats.js",
  "data/deepseek-context-overrides.js",
  "data/deepseek-lexical-overrides.js",
  "data/word-banks.js"
].forEach((file) => vm.runInContext(fs.readFileSync(file, "utf8"), sandbox, { filename: file }));
const bank = sandbox.window.WORD_BANKS.find((item) => item.id === "kaoyan");
process.stdout.write(JSON.stringify(bank.words.map((word) => word.id)));
"""
        result = subprocess.run(["node", "-e", script], check=True, capture_output=True, text=True)
        words = [item.strip().lower() for item in json.loads(result.stdout) if item.strip()]
    else:
        # Importing the giant JS bank from Python is unnecessary here; this
        # default sample is enough for smoke tests. Use --words for real runs.
        words = ["school", "subject", "demand", "quality", "condition"]
    return words[:limit] if limit else words


def decode(value: bytes | str, encoding: str = "utf-8") -> str:
    if isinstance(value, bytes):
        return value.decode(encoding, "ignore")
    return str(value)


def read_mdx(mdx_path: Path, words: list[str]) -> dict[str, dict[str, str]]:
    lookup_to_words: dict[str, list[str]] = {word: [word] for word in words}
    for word, lookup in OALD_ALIASES.items():
        if word in words:
            lookup_to_words.setdefault(lookup, []).append(word)
    targets = set(lookup_to_words)
    found: dict[str, dict[str, str]] = {}
    mdx = MDX(str(mdx_path))
    for raw_key, raw_html in mdx.items():
        key = decode(raw_key).strip().lower()
        if key not in targets:
            continue
        source = decode(raw_html)
        parsed = parse_entry(source)
        for word in lookup_to_words[key]:
            if word not in found or key == word:
                found[word] = {**parsed, "lookup": key}
        if len(found) == len(words):
            break
    return found


def parse_entry(source: str) -> dict[str, str]:
    soup = BeautifulSoup(source, "html.parser")
    phon = soup.select_one(".phon")
    audio_uk = soup.select_one(".phons_br a.sound[href^='sound://']") or soup.select_one("a.pron-uk[href^='sound://']")
    audio_us = soup.select_one(".phons_n_am a.sound[href^='sound://']") or soup.select_one("a.pron-us[href^='sound://']")
    definition_node = (
        soup.select_one(".def")
        or soup.select_one(".sense .def")
        or soup.select_one(".sense")
        or soup.select_one(".entry")
    )
    definition = " ".join(definition_node.get_text(" ", strip=True).split()) if definition_node else ""
    definition = html.unescape(definition)
    if len(definition) > 220:
        definition = definition[:220].rstrip() + "..."
    audio_ref = ""
    audio_ref_us = ""
    if audio_uk and audio_uk.get("href"):
        audio_ref = audio_uk.get("href", "").replace("sound://", "").strip()
    if audio_us and audio_us.get("href"):
        audio_ref_us = audio_us.get("href", "").replace("sound://", "").strip()
    return {
        "definition": definition,
        "phonetic": phon.get_text(" ", strip=True) if phon else "",
        "audio_ref": audio_ref,
        "audio_ref_us": audio_ref_us
    }


def extract_audio(mdd_paths: list[Path], entries: dict[str, dict[str, str]], audio_dir: Path) -> dict[str, str]:
    refs = {word: entry["audio_ref"] for word, entry in entries.items() if entry["audio_ref"]}
    wanted: dict[str, list[str]] = {}
    for word, ref in refs.items():
        wanted.setdefault(normalise_resource_name(ref), []).append(word)
    audio_dir.mkdir(parents=True, exist_ok=True)
    out: dict[str, str] = {}
    for mdd_path in mdd_paths:
        if not mdd_path.exists():
            continue
        mdd = MDD(str(mdd_path))
        for raw_key, blob in mdd.items():
            key = decode(raw_key).replace("\\", "/").lstrip("/")
            words = wanted.get(normalise_resource_name(key))
            if not words:
                continue
            filename = Path(refs[words[0]]).name
            target = audio_dir / filename
            target.write_bytes(blob)
            for word in words:
                out[word] = str(target).replace("\\", "/")
            if len(out) == len(refs):
                return out
    return out


def normalise_resource_name(value: str) -> str:
    return re.sub(r"^[/\\]+", "", value).replace("\\", "/").lower()


if __name__ == "__main__":
    main()
