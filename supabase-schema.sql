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
