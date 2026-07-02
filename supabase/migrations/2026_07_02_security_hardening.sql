alter table public.order_processors enable row level security;
alter table public.admins           enable row level security;
alter table public.categories       enable row level security;
alter table public.orders           enable row level security;

create or replace function public.current_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own_no_role_change" on public.profiles;
create policy "profiles_update_own_no_role_change" on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

drop policy if exists "admins_select_admin_only" on public.admins;
create policy "admins_select_admin_only" on public.admins
  for select using (public.current_role() = 'admin');

drop policy if exists "order_processors_select" on public.order_processors;
create policy "order_processors_select" on public.order_processors
  for select using (public.current_role() in ('admin', 'order_processor'));

drop policy if exists "categories_select_staff" on public.categories;
create policy "categories_select_staff" on public.categories
  for select using (auth.role() = 'authenticated');

drop policy if exists "categories_write_admin" on public.categories;
create policy "categories_write_admin" on public.categories
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

drop policy if exists "orders_select" on public.orders;
create policy "orders_select" on public.orders
  for select using (
    public.current_role() in ('admin', 'order_processor')
    or salesperson_id in (
      select id from public.sales_force where email = auth.jwt() ->> 'email'
    )
  );

drop policy if exists "orders_insert_sales" on public.orders;
create policy "orders_insert_sales" on public.orders
  for insert with check (
    salesperson_id in (
      select id from public.sales_force where email = auth.jwt() ->> 'email'
    )
  );

drop policy if exists "orders_update_processor" on public.orders;
create policy "orders_update_processor" on public.orders
  for update using (public.current_role() in ('admin', 'order_processor'));

select tablename, rowsecurity from pg_tables where schemaname = 'public';

