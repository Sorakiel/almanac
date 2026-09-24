-- Profile avatar colour (v0.6 §2.7).
--
-- The profile screen draws a monogram on one of five gradients the user picks
-- in "Изменить профиль". It is identity, not a preference: friends see the same
-- avatar, so it lives on `profiles` (readable by connections) rather than in
-- `user_settings` (own row only).
--
-- A named key, not a colour value: the gradients are design tokens and may be
-- retuned per theme without rewriting anyone's row. Null means the default
-- (the brand ember).
--
-- No new RLS policy: "profiles: update own" already covers the column, and the
-- role-escalation trigger from 0006 only guards `role`.

alter table public.profiles
  add column if not exists avatar_color text
  check (avatar_color in ('ember', 'teal', 'amber', 'violet', 'graphite'));

comment on column public.profiles.avatar_color is
  'Avatar gradient key chosen on the profile screen; null = ember (default).';
