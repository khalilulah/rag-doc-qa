-- 1. Enable required extensions
create extension if not exists vector;
create extension if not exists pg_cron;

-- 2. Documents table (one row per uploaded file)
create table documents (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  session_id text not null,
  created_at timestamptz default now()
);

-- 3. Chunks table (one row per chunk of text + its embedding)

drop function if exists match_chunks;
drop index if exists chunks_embedding_idx; -- in case the hnsw one partially created
drop table if exists chunks;

create table chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  content text not null,
  page_number int not null,
  embedding vector(3072)
);

-- no index for now — see note above on why

create or replace function match_chunks (
  query_embedding vector(3072),
  match_count int,
  filter_document_id uuid
)
returns table (id uuid, content text, page_number int, similarity float)
language sql stable
as $$
  select
    id,
    content,
    page_number,
    1 - (embedding <=> query_embedding) as similarity
  from chunks
  where document_id = filter_document_id
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- 6. Cleanup function: delete anything older than 2 hours
create or replace function delete_expired_sessions()
returns void
language sql
as $$
  delete from documents where created_at < now() - interval '2 hours';
$$;

-- 7. Schedule the cleanup to run every 30 minutes
select cron.schedule('cleanup-expired-sessions', '*/30 * * * *', 'select delete_expired_sessions()');