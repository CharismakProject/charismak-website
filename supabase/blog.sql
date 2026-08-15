create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 5 and 180),
  excerpt text not null check (char_length(excerpt) between 20 and 500),
  category text not null default 'Construction news',
  published_at timestamptz not null default now(),
  read_time text not null default '5 min read',
  sections jsonb not null default '[]'::jsonb check (jsonb_typeof(sections) = 'array'),
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog_posts enable row level security;

drop policy if exists "Anyone can read published blog posts" on public.blog_posts;
create policy "Anyone can read published blog posts"
on public.blog_posts for select
using (status = 'published');

drop policy if exists "Charismak admins can read all blog posts" on public.blog_posts;
create policy "Charismak admins can read all blog posts"
on public.blog_posts for select to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) in ('md@charismakproject.com', 'info@charismakproject.com'));

drop policy if exists "Charismak admins can create blog posts" on public.blog_posts;
create policy "Charismak admins can create blog posts"
on public.blog_posts for insert to authenticated
with check (lower(coalesce(auth.jwt() ->> 'email', '')) in ('md@charismakproject.com', 'info@charismakproject.com'));

drop policy if exists "Charismak admins can update blog posts" on public.blog_posts;
create policy "Charismak admins can update blog posts"
on public.blog_posts for update to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) in ('md@charismakproject.com', 'info@charismakproject.com'))
with check (lower(coalesce(auth.jwt() ->> 'email', '')) in ('md@charismakproject.com', 'info@charismakproject.com'));

drop policy if exists "Charismak admins can delete blog posts" on public.blog_posts;
create policy "Charismak admins can delete blog posts"
on public.blog_posts for delete to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) in ('md@charismakproject.com', 'info@charismakproject.com'));

create index if not exists blog_posts_publication_idx
on public.blog_posts (status, published_at desc);

insert into public.blog_posts (slug, title, excerpt, category, published_at, read_time, sections, status)
values
(
  'how-to-estimate-building-cost-before-construction',
  'How to estimate a building cost before construction starts',
  'A plain-language route from floor area and finish level to a reviewable planning range—and the limits you should understand.',
  'Cost planning', '2026-08-15T12:00:00Z', '6 min read',
  $json$[
    {"heading":"Start with the information you actually know","paragraphs":["An early estimate does not need to pretend that a full drawing and bill of quantities already exist. Start with the proposed location, approximate floor area, number of floors, room mix and expected finish level.","The result should be shown as a range. A single precise-looking number at this stage can hide uncertainty in the design, market prices and site conditions."]},
    {"heading":"Separate the main cost sections","paragraphs":["A useful building estimate separates foundations, frame, walls, roof, openings, finishes, services, external works and preliminaries. This makes the figure easier to review and later replace with measured quantities."],"points":["Confirm whether the floor area is per floor or total for all floors.","Treat external works and professional fees separately.","Record every major assumption beside the estimate."]},
    {"heading":"Know when to move to a BOQ","paragraphs":["Once drawings and specifications are available, the planning range should be developed into measured items with descriptions, units, quantities and rates. That is the stage where a quantity surveyor or experienced estimator adds the most value."]}
  ]$json$::jsonb,
  'published'
),
(
  'brc-mesh-for-oversite-concrete',
  'BRC mesh for oversite concrete: types, sheets, laps and buying quantity',
  'Why oversite reinforcement is normally measured by area but purchased as complete welded-mesh sheets.',
  'Materials', '2026-08-15T12:00:00Z', '5 min read',
  $json$[
    {"heading":"Measured area is not the purchase quantity","paragraphs":["The oversite area is measured in square metres. BRC or welded mesh is supplied in sheets, so the estimator must also consider the actual sheet size, laps between sheets, cutting waste and the need to round up to whole sheets."]},
    {"heading":"The designation matters","paragraphs":["A98, A142, A193 and A252 are not interchangeable labels. Each designation represents a different steel area and mesh weight. The structural drawing or engineer's specification should control the selection."],"points":["Confirm the mesh designation.","Confirm the supplier's sheet dimensions.","Add the specified lap and practical cutting allowance.","Do not substitute mesh strength without design approval."]},
    {"heading":"How the estimator should display it","paragraphs":["A clear result shows the net area, area including laps, number of full sheets, total mesh weight and binding wire. This keeps the technical quantity useful to a professional while making the purchase list understandable to a homeowner or buyer."]}
  ]$json$::jsonb,
  'published'
),
(
  'buying-sand-and-granite-by-truck',
  'Buying sand and granite by truck without losing the technical quantity',
  'Connect cubic metres and tonnes to a supplier''s named truck capacity before comparing quotations.',
  'Procurement', '2026-08-15T12:00:00Z', '5 min read',
  $json$[
    {"heading":"A truck is not a fixed unit","paragraphs":["The word ‘truck’ does not guarantee one volume or one weight. Body dimensions, loading practice, material density and moisture all affect the delivered quantity. Ask the supplier to state the truck capacity in cubic metres or tonnes."]},
    {"heading":"Keep the conversion visible","paragraphs":["Sand used in an estimate is normally measured by volume, while granite is commonly quoted by weight or truck load. The app can show both, using a stated density for the conversion. The assumed density should stay editable because material and moisture conditions vary."],"points":["Record the technical requirement in m³.","Record the assumed density in tonnes per m³.","Record the selected truck capacity and whether it is volume- or weight-based.","Round up trips only after comparing the remaining quantity."]},
    {"heading":"Check delivery conditions","paragraphs":["Compare the material price together with haulage, offloading, access restrictions and the supplier's delivery radius. A cheaper distant source can become more expensive at the site gate."]}
  ]$json$::jsonb,
  'published'
),
(
  'boq-explained-for-homeowners',
  'A bill of quantities explained for homeowners',
  'What descriptions, units, quantities, rates and assumptions mean—and why an early cost plan is not a final contract price.',
  'BOQ basics', '2026-08-15T12:00:00Z', '6 min read',
  $json$[
    {"heading":"What a BOQ does","paragraphs":["A bill of quantities organises construction work into measurable descriptions. It gives contractors a common basis for pricing and gives the client a clearer way to review where the money is expected to go."]},
    {"heading":"Read the five basic parts","paragraphs":["Most items can be understood through the item code, description, unit, quantity and rate. The amount is normally the bill quantity multiplied by the selected rate."],"points":["Description: exactly what work or material is included.","Unit: how the work is measured, such as m, m², m³, kg or number.","Quantity: the measured amount.","Rate: the price per unit.","Amount: quantity multiplied by rate."]},
    {"heading":"Do not ignore assumptions","paragraphs":["A BOQ can only reflect the documents and information used to prepare it. Drawing revisions, specification changes, ground conditions and market changes can affect the final cost. Keep assumptions and exclusions beside the bill."]}
  ]$json$::jsonb,
  'published'
),
(
  'choosing-and-reviewing-construction-suppliers-artisans',
  'How to choose and review construction suppliers and artisans',
  'A practical checklist for quotation comparison, delivery, workmanship, documentation and platform reviews.',
  'Marketplace', '2026-08-15T12:00:00Z', '5 min read',
  $json$[
    {"heading":"Compare like with like","paragraphs":["A low quotation is only meaningful when the material specification, quantity, delivery location, tax, offloading and payment terms match. Ask every supplier to use the same request description."]},
    {"heading":"Check evidence before commitment","paragraphs":["For artisans, review similar completed work, agree the measurable scope and record who provides tools, access equipment and materials. For suppliers, confirm the brand, source, capacity and delivery schedule."],"points":["Use written scope and price information.","Confirm contact and service area.","Avoid paying the full value before verifiable progress or delivery.","Record factual reviews about quality, timing and communication."]},
    {"heading":"Connect procurement to the estimate","paragraphs":["A marketplace is most useful when a request for quotation carries the item description, required purchase quantity and delivery location from the estimate. This reduces retyping and makes competing quotations easier to compare."]}
  ]$json$::jsonb,
  'published'
)
on conflict (slug) do nothing;
