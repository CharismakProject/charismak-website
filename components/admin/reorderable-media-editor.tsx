"use client";

import { GripVertical, MoveDown, MoveUp, Trash2 } from "lucide-react";
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
    <div className="grid gap-2 sm:grid-cols-2">
      {urls.map((url, index) => (
        <div
          key={`${url}-${index}`}
          draggable
          onDragStart={() => setDraggedIndex(index)}
          onDragEnd={() => setDraggedIndex(null)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (draggedIndex === null) return;
            move(draggedIndex, index);
            setDraggedIndex(null);
          }}
          className={`group flex items-center gap-2 rounded-xl border bg-white p-2 transition ${draggedIndex === index ? "border-[#C8A45D] opacity-70" : "border-[#DCE4EC]"}`}
        >
          <div className="grid h-9 w-7 shrink-0 cursor-grab place-items-center text-[#7A8B9E]" title="Drag to reorder">
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="relative shrink-0">
            <img src={url} alt={`Project media ${index + 1}`} className="h-14 w-20 rounded-lg object-cover" />
            <span className="absolute bottom-1 left-1 rounded bg-[#071E33]/85 px-1.5 py-0.5 text-[9px] font-black text-white">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <span className="min-w-0 flex-1 truncate text-[10px] text-[#617286]">{url}</span>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => move(index, 0)}
              disabled={index === 0}
              className="grid h-8 w-8 place-items-center rounded-lg border border-[#DCE4EC] text-[#0D3B66] disabled:cursor-not-allowed disabled:opacity-30"
              aria-label={`Move image ${index + 1} to first`}
              title="Move to first"
            >
              <MoveUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => move(index, urls.length - 1)}
              disabled={index === urls.length - 1}
              className="grid h-8 w-8 place-items-center rounded-lg border border-[#DCE4EC] text-[#0D3B66] disabled:cursor-not-allowed disabled:opacity-30"
              aria-label={`Move image ${index + 1} to last`}
              title="Move to last"
            >
              <MoveDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => remove(index)}
              className="grid h-8 w-8 place-items-center rounded-lg bg-[#FFF1EE] text-[#A82B05]"
              aria-label={`Remove image ${index + 1}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
