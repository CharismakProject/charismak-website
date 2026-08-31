-- F03 steel Google Form submissions can provide the selected product/specification
-- and its price in separate columns. Preserve those submissions as review lines
-- even when the Edge Function compact-line parser cannot pair the fields itself.

create or replace function public.supplier_form_column_value(payload jsonb, needle text)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(col ->> 'value', '')
  from pg_catalog.jsonb_array_elements(coalesce(payload -> 'columns', '[]'::jsonb)) as col
  where pg_catalog.lower(coalesce(col ->> 'header', '')) like '%' || pg_catalog.lower(needle) || '%'
  order by coalesce((col ->> 'index')::integer, 0)
  limit 1;
$$;

create or replace function public.skip_duplicate_supplier_review_line()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.supplier_review_lines existing
    where existing.batch_id = new.batch_id
      and coalesce(existing.catalogue_item_id, '') = coalesce(new.catalogue_item_id, '')
      and pg_catalog.lower(coalesce(existing.product_name, '')) = pg_catalog.lower(coalesce(new.product_name, ''))
      and pg_catalog.lower(coalesce(existing.specification, '')) = pg_catalog.lower(coalesce(new.specification, ''))
      and pg_catalog.lower(coalesce(existing.brand, '')) = pg_catalog.lower(coalesce(new.brand, ''))
      and pg_catalog.lower(coalesce(existing.quoted_unit, '')) = pg_catalog.lower(coalesce(new.quoted_unit, ''))
      and existing.unit_price is not distinct from new.unit_price
      and pg_catalog.lower(coalesce(existing.location, '')) = pg_catalog.lower(coalesce(new.location, ''))
  ) then
    return null;
  end if;
  return new;
end;
$$;

drop trigger if exists supplier_review_lines_skip_duplicates on public.supplier_review_lines;
create trigger supplier_review_lines_skip_duplicates
before insert on public.supplier_review_lines
for each row execute function public.skip_duplicate_supplier_review_line();

create or replace function public.populate_structured_steel_review_lines()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_location text;
  validity_text text;
  validity_days_text text;
  valid_until_date date;
  reinforcement_spec text;
  reinforcement_basis text;
  reinforcement_brand text;
  reinforcement_price_text text;
  reinforcement_clean_price text;
  reinforcement_unit text;
  brc_type text;
  brc_key text;
  brc_price_text text;
  brc_clean_price text;
  brc_item_id text;
  brc_code text;
begin
  if coalesce(pg_catalog.upper(new.form_id), '') <> 'F03'
     and not (
       pg_catalog.lower(coalesce(new.form_title, '')) like '%reinforcement%'
       and pg_catalog.lower(coalesce(new.form_title, '')) like '%structural%'
       and pg_catalog.lower(coalesce(new.form_title, '')) like '%steel%'
     ) then
    return new;
  end if;

  if coalesce(new.form_id, '') = '' then
    update public.supplier_review_batches
    set form_id = 'F03', updated_at = pg_catalog.now()
    where id = new.id;
  end if;

  resolved_location := coalesce(
    nullif(pg_catalog.btrim(new.supplier_location), ''),
    nullif(pg_catalog.btrim(public.supplier_form_column_value(new.raw_payload, 'main supply location')), ''),
    'Nigeria'
  );

  validity_text := public.supplier_form_column_value(new.raw_payload, 'how long should we treat these steel prices as current');
  validity_days_text := substring(validity_text from '([0-9]+)');
  if validity_days_text is not null then
    valid_until_date := coalesce(new.submitted_at, pg_catalog.now())::date
      + least(greatest(validity_days_text::integer, 1), 365);
  end if;

  reinforcement_spec := pg_catalog.btrim(public.supplier_form_column_value(new.raw_payload, 'diameters you normally stock'));
  reinforcement_basis := pg_catalog.btrim(public.supplier_form_column_value(new.raw_payload, 'price basis you can quote'));
  reinforcement_brand := pg_catalog.btrim(public.supplier_form_column_value(new.raw_payload, 'main mills / brands you stock'));
  reinforcement_price_text := pg_catalog.btrim(public.supplier_form_column_value(new.raw_payload, 'current reinforcement prices'));
  reinforcement_clean_price := pg_catalog.regexp_replace(reinforcement_price_text, '[₦,[:space:]]', '', 'g');

  if reinforcement_clean_price ~ '^[0-9]+([.][0-9]+)?$'
     and reinforcement_spec <> ''
     and (
       pg_catalog.lower(reinforcement_basis) like '%ton%'
       or pg_catalog.lower(reinforcement_basis) like '%kg%'
       or (
         pg_catalog.strpos(reinforcement_spec, ',') = 0
         and pg_catalog.strpos(reinforcement_spec, ';') = 0
         and pg_catalog.strpos(reinforcement_spec, pg_catalog.chr(10)) = 0
       )
     ) then
    reinforcement_unit := case
      when pg_catalog.lower(reinforcement_basis) like '%ton%' then 'tonne'
      when pg_catalog.lower(reinforcement_basis) like '%kg%' then 'kg'
      when pg_catalog.lower(reinforcement_basis) like '%length%' then '12 m length'
      else coalesce(nullif(pg_catalog.lower(reinforcement_basis), ''), 'item')
    end;

    insert into public.supplier_review_lines (
      batch_id, catalogue_item_id, catalogue_code, product_name, specification,
      brand, quoted_unit, unit_price, location, valid_until, match_confidence
    ) values (
      new.id, 'reinforcement-steel', 'MAT-006', 'High-yield reinforcement steel', reinforcement_spec,
      nullif(reinforcement_brand, ''), reinforcement_unit, reinforcement_clean_price::numeric,
      resolved_location, valid_until_date, 0.95
    );
  end if;

  brc_type := pg_catalog.btrim(public.supplier_form_column_value(new.raw_payload, 'mesh types you stock'));
  brc_price_text := pg_catalog.btrim(public.supplier_form_column_value(new.raw_payload, 'current brc prices per'));
  brc_clean_price := pg_catalog.regexp_replace(brc_price_text, '[₦,[:space:]]', '', 'g');

  if brc_clean_price ~ '^[0-9]+([.][0-9]+)?$'
     and brc_type <> ''
     and pg_catalog.strpos(brc_type, ',') = 0
     and pg_catalog.strpos(brc_type, ';') = 0
     and pg_catalog.strpos(brc_type, pg_catalog.chr(10)) = 0 then
    brc_key := pg_catalog.upper(pg_catalog.regexp_replace(brc_type, '[^A-Za-z0-9]', '', 'g'));
    brc_item_id := case brc_key
      when 'A98' then 'brc-a98-sheet'
      when 'A142' then 'brc-a142-sheet'
      when 'A193' then 'brc-a193-sheet'
      when 'A252' then 'brc-a252-sheet'
      else null
    end;
    brc_code := case brc_key
      when 'A98' then 'MAT-015'
      when 'A142' then 'MAT-016'
      when 'A193' then 'MAT-017'
      when 'A252' then 'MAT-018'
      else null
    end;

    insert into public.supplier_review_lines (
      batch_id, catalogue_item_id, catalogue_code, product_name, specification,
      brand, quoted_unit, unit_price, location, valid_until, match_confidence
    ) values (
      new.id, brc_item_id, brc_code,
      case when brc_key <> '' then brc_key || ' BRC welded mesh' else 'BRC welded mesh' end,
      '2.4 × 4.8 m sheet', null, 'sheet', brc_clean_price::numeric,
      resolved_location, valid_until_date, case when brc_item_id is null then 0.60 else 0.98 end
    );
  end if;

  return new;
end;
$$;

drop trigger if exists supplier_review_batches_structured_steel_lines on public.supplier_review_batches;
create trigger supplier_review_batches_structured_steel_lines
after insert on public.supplier_review_batches
for each row execute function public.populate_structured_steel_review_lines();
