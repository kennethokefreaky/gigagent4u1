-- Backfill candidates for promoters (e.g., keithcarols) from existing data
-- Safe to run multiple times: guarded by NOT EXISTS checks

-- 1) From applications (pending or accepted)
insert into candidates (
  talent_id,
  promoter_id,
  event_id,
  event_title,
  offer_amount,
  status,
  talent_name,
  talent_categories,
  talent_location,
  talent_image_url
)
select
  a.talent_id,
  a.promoter_id,
  a.event_id,
  p.title as event_title,
  '0' as offer_amount, -- applications has no amount column; default to '0'
  case when a.status in ('accepted','pending') then a.status else 'pending' end as status,
  coalesce(pr.full_name, pr.email, 'Unknown Talent') as talent_name,
  pr.talent_categories,
  pr.location,
  pr.profile_image_url
from applications a
join posts p on p.id = a.event_id
join profiles pr on pr.id = a.talent_id
where a.status in ('accepted','pending')
  and not exists (
    select 1 from candidates c
    where c.event_id = a.event_id
      and c.talent_id = a.talent_id
  );

-- 2) From message_participants (group members) who are not yet in candidates
-- Treat as pending so promoter sees them under Candidates
insert into candidates (
  talent_id,
  promoter_id,
  event_id,
  event_title,
  offer_amount,
  status,
  talent_name,
  talent_categories,
  talent_location,
  talent_image_url
)
select
  mp.user_id as talent_id,
  p.promoter_id,
  mp.event_id,
  p.title as event_title,
  '0' as offer_amount,
  'pending' as status,
  coalesce(pr.full_name, pr.email, 'Unknown Talent') as talent_name,
  pr.talent_categories,
  pr.location,
  pr.profile_image_url
from message_participants mp
join posts p on p.id = mp.event_id
join profiles pr on pr.id = mp.user_id
-- exclude the promoter themselves if present in message_participants
where mp.user_id <> p.promoter_id
  and not exists (
    select 1 from candidates c
    where c.event_id = mp.event_id
      and c.talent_id = mp.user_id
  );

-- Optional: limit to a single promoter (uncomment and set the UUID)
-- and p.promoter_id = 'KEITHCAROLS-USER-ID-UUID'

-- Verify results
-- select * from candidates where promoter_id = 'KEITHCAROLS-USER-ID-UUID' order by created_at desc;


