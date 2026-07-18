-- Feedback management for admins/owner.
--
-- migration 0001 only gave feedback SELECT (own or admin) and INSERT (own). The
-- admin console needs to triage feedback — change its status (resolve/reject) and
-- delete it. Add admin-only UPDATE + DELETE policies, plus let a user delete their
-- own feedback. All guarded by the existing public.is_admin() (covers owner).

-- Admins/owner may retriage any feedback (status changes). WITH CHECK mirrors
-- USING so an admin can't reassign a row to another user.
create policy "feedback: update admin" on feedback
  for update using (public.is_admin()) with check (public.is_admin());

-- Admins/owner may remove any feedback; users may remove their own.
create policy "feedback: delete own or admin" on feedback
  for delete using (user_id = auth.uid() or public.is_admin());
