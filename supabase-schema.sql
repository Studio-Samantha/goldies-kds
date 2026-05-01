create table if not exists public.kds_orders (
  square_order_id text primary key,
  order_number text,
  customer_name text,
  created_at timestamptz not null,
  source text not null default 'Square Register',
  status text not null default 'new' check (status in ('new', 'making', 'ready', 'completed', 'done')),
  dining_option text not null default 'Order',
  completed_at timestamptz,
  square_state text,
  raw_order jsonb,
  updated_at timestamptz not null default now()
);

alter table public.kds_orders
  add column if not exists customer_name text;

alter table public.kds_orders
  add column if not exists completed_at timestamptz;

create table if not exists public.kds_order_items (
  id bigserial primary key,
  order_id text not null references public.kds_orders(square_order_id) on delete cascade,
  square_line_item_uid text,
  name text not null,
  quantity integer not null default 1,
  modifiers jsonb not null default '[]'::jsonb,
  note text not null default '',
  category text check (category in ('Coffee', 'Not Coffee', 'Smoothies') or category is null),
  created_at timestamptz not null default now()
);

create index if not exists kds_orders_status_idx on public.kds_orders(status);
create index if not exists kds_orders_created_at_idx on public.kds_orders(created_at desc);
create index if not exists kds_order_items_order_id_idx on public.kds_order_items(order_id);
create index if not exists kds_order_items_category_idx on public.kds_order_items(category);

create table if not exists public.kds_settings (
  setting_key text primary key,
  password_hash text not null,
  password_salt text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.kds_sign_in_events (
  id bigserial primary key,
  employee_name text not null,
  signed_in_at timestamptz not null default now(),
  signed_out_at timestamptz,
  device_label text,
  user_agent text,
  session_id text
);

create index if not exists kds_sign_in_events_employee_name_idx
  on public.kds_sign_in_events(employee_name);

create index if not exists kds_sign_in_events_signed_in_at_idx
  on public.kds_sign_in_events(signed_in_at desc);

create index if not exists kds_sign_in_events_session_id_idx
  on public.kds_sign_in_events(session_id);

create table if not exists public.kds_audit_logs (
  id bigserial primary key,
  actor_employee_name text,
  action text not null,
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists kds_audit_logs_action_idx
  on public.kds_audit_logs(action);

create index if not exists kds_audit_logs_actor_employee_name_idx
  on public.kds_audit_logs(actor_employee_name);

create index if not exists kds_audit_logs_created_at_idx
  on public.kds_audit_logs(created_at desc);

create table if not exists public.kds_owner_snapshots (
  id bigserial primary key,
  snapshot_date date not null,
  range_key text not null,
  range_label text not null,
  start_at timestamptz,
  end_at timestamptz,
  order_count integer not null default 0,
  multi_drink_order_count integer not null default 0,
  multi_drink_order_rate numeric not null default 0,
  drink_units numeric not null default 0,
  total_revenue_cents integer not null default 0,
  average_order_value_cents integer not null default 0,
  top_category text,
  peak_hour integer,
  peak_hour_label text,
  slow_hour integer,
  slow_hour_label text,
  summary text not null default '',
  money_signal text not null default '',
  owner_action text not null default '',
  report jsonb not null default '{}'::jsonb,
  advice jsonb not null default '[]'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (snapshot_date, range_key)
);

create index if not exists kds_owner_snapshots_snapshot_date_idx
  on public.kds_owner_snapshots(snapshot_date desc);

create index if not exists kds_owner_snapshots_range_key_idx
  on public.kds_owner_snapshots(range_key);

alter table public.kds_owner_snapshots
  add column if not exists multi_drink_order_count integer not null default 0;

alter table public.kds_owner_snapshots
  add column if not exists multi_drink_order_rate numeric not null default 0;

create table if not exists public.kds_customer_insights (
  id bigserial primary key,
  customer_name text not null default '',
  drink_name text not null default '',
  note text not null,
  source_order_id text,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists kds_customer_insights_created_at_idx
  on public.kds_customer_insights(created_at desc);

create index if not exists kds_customer_insights_customer_name_idx
  on public.kds_customer_insights(customer_name);

create table if not exists public.drinkflow_leads (
  id bigserial primary key,
  email text not null unique,
  shop_name text not null default '',
  feature_interest text not null default '',
  source text not null default 'learn-more',
  page_path text not null default '',
  referrer text not null default '',
  user_agent text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists drinkflow_leads_created_at_idx
  on public.drinkflow_leads(created_at desc);

create index if not exists drinkflow_leads_source_idx
  on public.drinkflow_leads(source);

create table if not exists public.drinkflow_surveys (
  id bigserial primary key,
  email text not null default '',
  contact_name text not null default '',
  shop_name text not null default '',
  business_type text not null default '',
  pos_system text not null default '',
  current_kds text not null default '',
  current_workflow text not null default '',
  screens jsonb not null default '[]'::jsonb,
  needs text not null default '',
  features jsonb not null default '[]'::jsonb,
  pricing text not null default '',
  custom_branding text not null default '',
  notes text not null default '',
  source text not null default 'survey',
  page_path text not null default '',
  referrer text not null default '',
  user_agent text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists drinkflow_surveys_created_at_idx
  on public.drinkflow_surveys(created_at desc);

create index if not exists drinkflow_surveys_pos_system_idx
  on public.drinkflow_surveys(pos_system);
