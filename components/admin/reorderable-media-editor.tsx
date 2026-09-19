"use client";

import { ArrowDown, ArrowUp, ChevronsDown, ChevronsUp, GripVertical, Trash2 } from "lucide-react";
import { useState } from "react";

type Props = {
  urls: string[];
  onChange: (urls: string[]) => void;
};

export default function ReorderableMediaEditor({ urls, onChange }: Props) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= urls.length || to >= urls.length) return;
    const next = [...urls];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(urls.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="grid gap-2">
      {urls.map((url, index) => (
        <div
          key={`${url}-${index}`}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }}
          onDrop={(event) => {
            event.preventDefault();
            const from = draggedIndex ?? Number(event.dataTransfer.getData("text/plain"));
            if (!Number.isInteger(from)) return;
            move(from, index);
            setDraggedIndex(null);
          }}
          className={`flex items-center gap-2 rounded-xl border bg-white p-2 transition ${draggedIndex === index ? "border-[#C8A45D] bg-[#FFF9EA]" : "border-[#DCE4EC]"}`}
        >
          <button
            type="button"
            draggable
            onDragStart={(event) => {
              setDraggedIndex(index);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", String(index));
            }}
            onDragEnd={() => setDraggedIndex(null)}
            className="grid h-10 w-9 shrink-0 cursor-grab place-items-center rounded-lg border border-[#DCE4EC] text-[#7A8B9E] active:cursor-grabbing"
            title="Drag this handle to reorder"
            aria-label={`Drag image ${index + 1} to reorder`}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="relative shrink-0">
            <img
              src={url}
              alt={`Project media ${index + 1}`}
              draggable={false}
              className="h-16 w-24 rounded-lg object-cover"
            />
            <span className="absolute bottom-1 left-1 rounded bg-[#071E33]/90 px-1.5 py-0.5 text-[9px] font-black text-white">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>

          <span className="min-w-0 flex-1 truncate text-[10px] text-[#617286]">{url}</span>

          <div className="grid shrink-0 grid-cols-5 gap-1">
            <button
              type="button"
              onClick={() => move(index, 0)}
              disabled={index === 0}
              className="grid h-8 w-8 place-items-center rounded-lg border border-[#DCE4EC] text-[#0D3B66] disabled:cursor-not-allowed disabled:opacity-25"
              aria-label={`Move image ${index + 1} to first`}
              title="Move to first"
            >
              <ChevronsUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => move(index, index - 1)}
              disabled={index === 0}
              className="grid h-8 w-8 place-items-center rounded-lg border border-[#DCE4EC] text-[#0D3B66] disabled:cursor-not-allowed disabled:opacity-25"
              aria-label={`Move image ${index + 1} one position earlier`}
              title="Move one position earlier"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => move(index, index + 1)}
              disabled={index === urls.length - 1}
              className="grid h-8 w-8 place-items-center rounded-lg border border-[#DCE4EC] text-[#0D3B66] disabled:cursor-not-allowed disabled:opacity-25"
              aria-label={`Move image ${index + 1} one position later`}
              title="Move one position later"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => move(index, urls.length - 1)}
              disabled={index === urls.length - 1}
              className="grid h-8 w-8 place-items-center rounded-lg border border-[#DCE4EC] text-[#0D3B66] disabled:cursor-not-allowed disabled:opacity-25"
              aria-label={`Move image ${index + 1} to last`}
              title="Move to last"
            >
              <ChevronsDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => remove(index)}
              className="grid h-8 w-8 place-items-center rounded-lg bg-[#FFF1EE] text-[#A82B05]"
              aria-label={`Remove image ${index + 1}`}
              title="Remove image"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
