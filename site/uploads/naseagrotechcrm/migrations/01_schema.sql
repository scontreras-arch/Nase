-- ============================================================
-- NASE Agrotech CRM · Esquema base (Supabase / Postgres)
-- Ejecutar en Supabase → SQL Editor. Idempotente (re-ejecutable).
-- ============================================================

-- ── LEADS ──
create table if not exists public.leads (
    id                    uuid primary key default gen_random_uuid(),
    lead_id               text unique,
    estado                text not null default 'Lead',   -- Lead|Calificado|Cotizado|Negociando|Ganado|Perdido|Pausado
    -- Clasificación / aplicación
    clasificacion         text default 'Agrícola',        -- Agrícola | Industrial
    tipo_cultivo          text,                            -- si Agrícola
    area_ha               numeric default 0,               -- área de cultivo (hectáreas)
    fecha_aplicacion      date,                            -- fecha tentativa de aplicación
    modelo_recomendado    text,                            -- DJI Agras T25/T50/T75/T100 (editable)
    -- Empresa & contacto
    razon_social          text,
    contacto_principal    text,
    cargo                 text,
    email                 text,
    telefono              text,
    whatsapp              text,
    ciudad_pais           text,
    -- Comercial
    lead_source           text,
    usd_estimado          numeric default 0,
    moneda                text default 'USD',
    probabilidad_pct      int default 10,
    cotizacion_competencia text default 'No',              -- Sí | No (¿el prospecto tiene cotización de la competencia?)
    competencia_detalle   text,
    causa_perdida         text,
    -- Seguimiento
    proxima_accion        text,
    fecha_proxima_accion  date,
    ultima_actividad      text,
    vendedor              text,                            -- por defecto = quien crea el lead
    notas                 text,
    fecha_primer_contacto date,
    fecha_cotizado        date,
    fecha_cerrado         date,
    -- Metadatos
    created_at            timestamptz default now(),
    updated_at            timestamptz default now(),
    created_by            uuid,
    updated_by            uuid
);

create index if not exists idx_leads_estado   on public.leads (estado);
create index if not exists idx_leads_vendedor on public.leads (vendedor);
create index if not exists idx_leads_clasif   on public.leads (clasificacion);

-- ── AUDITORÍA ──
create table if not exists public.audit_log (
    id             bigint generated always as identity primary key,
    lead_id        uuid,
    user_email     text,
    accion         text,                                   -- INSERT | UPDATE | DELETE
    campo          text,
    valor_anterior text,
    valor_nuevo    text,
    timestamp      timestamptz default now()
);
create index if not exists idx_audit_lead on public.audit_log (lead_id);
create index if not exists idx_audit_ts   on public.audit_log (timestamp desc);

-- ── updated_at automático ──
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_leads_updated on public.leads;
create trigger trg_leads_updated before update on public.leads
    for each row execute function public.set_updated_at();

-- ── Auditoría automática de cambios en leads ──
create or replace function public.audit_leads()
returns trigger language plpgsql as $$
declare
    email text := coalesce((auth.jwt() ->> 'email'), 'sistema');
    f text;
    campos text[] := array['estado','clasificacion','tipo_cultivo','area_ha','fecha_aplicacion',
        'modelo_recomendado','usd_estimado','probabilidad_pct','cotizacion_competencia',
        'vendedor','proxima_accion','fecha_proxima_accion','razon_social','contacto_principal','causa_perdida'];
    ov text; nv text;
begin
    if TG_OP = 'INSERT' then
        insert into public.audit_log(lead_id,user_email,accion,campo,valor_nuevo)
        values (new.id, email, 'INSERT', 'lead_creado', new.lead_id);
        return new;
    elsif TG_OP = 'DELETE' then
        insert into public.audit_log(lead_id,user_email,accion,campo,valor_anterior)
        values (old.id, email, 'DELETE', 'lead_eliminado', old.lead_id);
        return old;
    else
        foreach f in array campos loop
            execute format('select ($1).%I::text, ($2).%I::text', f, f) into ov, nv using old, new;
            if coalesce(ov,'') is distinct from coalesce(nv,'') then
                insert into public.audit_log(lead_id,user_email,accion,campo,valor_anterior,valor_nuevo)
                values (new.id, email, 'UPDATE', f, ov, nv);
            end if;
        end loop;
        return new;
    end if;
end $$;

drop trigger if exists trg_leads_audit on public.leads;
create trigger trg_leads_audit after insert or update or delete on public.leads
    for each row execute function public.audit_leads();

-- ── RLS: sólo usuarios autenticados ──
alter table public.leads      enable row level security;
alter table public.audit_log  enable row level security;

drop policy if exists p_leads_auth on public.leads;
create policy p_leads_auth on public.leads for all
    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists p_audit_auth on public.audit_log;
create policy p_audit_auth on public.audit_log for all
    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
