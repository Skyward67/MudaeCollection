import { useState } from "react";
import { useCards } from "../hooks/useCards";
import type { Card } from "../db/schema";

// Supported formats (more to be added):
// Format 1: "name - serie value unit"  e.g. "Rem - Re:Zero 1000 kakera"
// TODO: add formats 2 and 3
function parseRawText(raw: string): Omit<Card, "id">[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const dashIdx = line.indexOf(" - ");
      if (dashIdx !== -1) {
        const name = line.slice(0, dashIdx).trim();
        const rest = line.slice(dashIdx + 3).trim();
        // Greedy match so serie can contain numbers; value is the last number, unit is optional trailing word
        const match = rest.match(/^(.*)\s+(\d+)(?:\s+\S+)?$/);
        if (match) {
          return { name, serie: match[1].trim(), value: Number(match[2]) };
        }
        return { name, serie: rest, value: undefined };
      }
      return { name: line, serie: undefined, value: undefined };
    })
    .filter((card) => card.name.length > 0);
}

const INSTRUCTIONS =
  'Paste your Mudae cards below, one per line. Example: "Rem - Re:Zero 1000 kakera"';

export function AddCardsForm({ onDone }: { onDone?: () => void }) {
  const { addCard } = useCards();
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<Omit<Card, "id">[]>([]);

  function handleParse() {
    setPreview(parseRawText(raw));
  }

  async function handleImport() {
    for (const card of preview) {
      await addCard(card);
    }
    setRaw("");
    setPreview([]);
    onDone?.();
  }

  return (
    <div className="p-4 flex flex-col gap-3 max-w-xl">
      <label className="text-sm font-medium">{INSTRUCTIONS}</label>

      <textarea
        className="rounded border p-2 text-sm font-mono min-h-[120px] resize-y"
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          setPreview([]);
        }}
        placeholder={"Rem - Re:Zero 1000 kakera\nEmilia - Re:Zero 900 kakera"}
      />

      <button
        className="rounded bg-gray-800 px-4 py-2 text-white text-sm w-fit"
        onClick={handleParse}
        disabled={!raw.trim()}
      >
        Preview
      </button>

      {preview.length > 0 && (
        <>
          <ul className="rounded border divide-y text-sm">
            {preview.map((card, i) => (
              <li key={i} className="px-3 py-2 flex gap-2">
                <span className="font-semibold">{card.name}</span>
                {card.serie && (
                  <span className="opacity-60">· {card.serie}</span>
                )}
                {card.value !== undefined && (
                  <span className="ml-auto opacity-50">{card.value}</span>
                )}
              </li>
            ))}
          </ul>

          <button
            className="rounded bg-black px-4 py-2 text-white text-sm w-fit"
            onClick={handleImport}
          >
            Import {preview.length} card{preview.length !== 1 ? "s" : ""}
          </button>
        </>
      )}
    </div>
  );
}