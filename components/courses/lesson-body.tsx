import { parseLessonBody } from "@/lib/content/courses-data";

export default function LessonBody({ body }: { body: string }) {
  return (
    <div className="space-y-5">
      {parseLessonBody(body).map((block, i) =>
        block.kind === "heading" ? <h2 key={i} className="pt-4 text-2xl font-semibold tracking-[-0.02em] text-[#071E33]">{block.text}</h2>
        : block.kind === "list" ? <ul key={i} className="list-disc space-y-2 pl-6 leading-8 text-[#3A4653] marker:text-[#C8A45D]">{block.items.map((item, k) => <li key={k}>{item}</li>)}</ul>
        : <p key={i} className="leading-8 text-[#3A4653]">{block.text}</p>,
      )}
    </div>
  );
}
