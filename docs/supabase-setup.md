# Supabase セットアップ（Myスケジュール / 訪問者プロファイル）

フロントエンドは **publishable（anon）キーのみ** を使用します。  
`service_role` キーはブラウザに置かないでください（漏洩＝全データ操作可能）。

## 1. プロジェクト情報（このサイト）

- Project URL: `https://zpdbigdzyktilsxpsvip.supabase.co`
- ブラウザ用キー: Dashboard → Settings → API → `anon` / `publishable`

## 2. SQL Editor で実行

```sql
create table if not exists public.visitor_profiles (
  local_id text primary key,
  age_band text,
  gender text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_schedules (
  id bigserial primary key,
  local_id text not null,
  schedule_id text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (local_id, schedule_id)
);

create index if not exists saved_schedules_local_id_idx
  on public.saved_schedules (local_id);

alter table public.visitor_profiles enable row level security;
alter table public.saved_schedules enable row level security;

drop policy if exists "visitor_profiles_anon_all" on public.visitor_profiles;
create policy "visitor_profiles_anon_all"
  on public.visitor_profiles
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "saved_schedules_anon_all" on public.saved_schedules;
create policy "saved_schedules_anon_all"
  on public.saved_schedules
  for all
  to anon, authenticated
  using (true)
  with check (true);
```

## 3. Dashboard で確認

1. Table Editor に `visitor_profiles` / `saved_schedules`
2. Authentication は不要（メールログインなし）
3. API の anon キーが `src/js/supabase-client.js` と一致
4. service_role はサーバー専用。GitHub にコミットしない

## 4. 動作確認

1. シークレットウィンドウで同意→チュートリアル
2. スケジュールで保存→ Myスケジュール
3. Table Editor で行が増えていること

## 5. セキュリティ

誰でも任意の local_id で読み書きできる設計です（イベント案内向け）。
厳格化する場合は Auth 匿名サインインや Edge Function で署名を検討してください。
