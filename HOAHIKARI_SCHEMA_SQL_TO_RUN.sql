-- HoaHikari database
create extension if not exists pgcrypto;

create table if not exists site_settings (
 id uuid primary key default gen_random_uuid(),
 hero_text text default 'Kiến thức Kaigo · CCQG Kaigo · Roadmap · Kinh nghiệm Nhật Bản',
 app_url text default '#',
 updated_at timestamptz default now()
);
insert into site_settings (hero_text,app_url)
select 'Kiến thức Kaigo · CCQG Kaigo · Roadmap · Kinh nghiệm Nhật Bản','#'
where not exists (select 1 from site_settings);

create table if not exists posts (
 id uuid primary key default gen_random_uuid(), title text not null, body text,
 image_url text, url text, publish_date date default current_date,
 published boolean default true, created_at timestamptz default now()
);
create table if not exists knowledge (like posts including all);
create table if not exists roadmap (like posts including all);
create table if not exists notices (like posts including all);
create table if not exists resources (like posts including all);

alter table site_settings enable row level security;
alter table posts enable row level security;
alter table knowledge enable row level security;
alter table roadmap enable row level security;
alter table notices enable row level security;
alter table resources enable row level security;

-- Public can read published content. Admin writes require authenticated users.
create policy "public read site" on site_settings for select using (true);
create policy "public read posts" on posts for select using (published=true);
create policy "public read knowledge" on knowledge for select using (published=true);
create policy "public read roadmap" on roadmap for select using (published=true);
create policy "public read notices" on notices for select using (published=true);
create policy "public read resources" on resources for select using (published=true);

create policy "auth manage site" on site_settings for all to authenticated using (true) with check (true);
create policy "auth manage posts" on posts for all to authenticated using (true) with check (true);
create policy "auth manage knowledge" on knowledge for all to authenticated using (true) with check (true);
create policy "auth manage roadmap" on roadmap for all to authenticated using (true) with check (true);
create policy "auth manage notices" on notices for all to authenticated using (true) with check (true);
create policy "auth manage resources" on resources for all to authenticated using (true) with check (true);

-- Optional storage bucket for future image upload.
insert into storage.buckets (id,name,public)
values ('hoahikari-images','hoahikari-images',true)
on conflict (id) do nothing;
create policy "public read images" on storage.objects for select using (bucket_id='hoahikari-images');
create policy "auth upload images" on storage.objects for insert to authenticated with check (bucket_id='hoahikari-images');
create policy "auth update images" on storage.objects for update to authenticated using (bucket_id='hoahikari-images') with check (bucket_id='hoahikari-images');
create policy "auth delete images" on storage.objects for delete to authenticated using (bucket_id='hoahikari-images');
