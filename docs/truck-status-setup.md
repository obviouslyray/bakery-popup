# Owner-driven sign status setup

This feature changes only the shared open/closed status. No recurring timer flips the sign.
GitHub Pages deployment does not run SQL migrations.

1. In Supabase SQL Editor, run supabase/migrations/20261110_truck_status.sql as an administrator.
2. Keep public sign-ups disabled. In Supabase Authentication > Users, identify the two approved owner accounts.
3. In SQL Editor, run `select id, email from auth.users;` to verify their UUIDs. Do not publish user lists or private credentials.
4. Replace the example UUID placeholders below with those two verified IDs, then run the statements in SQL Editor (not in browser code):

```sql
insert into public.truck_status_owners (slot, user_id)
values (1, 'FIRST_OWNER_UUID'::uuid), (2, 'SECOND_OWNER_UUID'::uuid)
on conflict (slot) do update set user_id = excluded.user_id;
```

The registry has exactly two available slots. It starts empty, so no app account can change status before enrollment. These approvals apply to this new status feature only; existing menu authorization is unchanged.

5. In Supabase Publications settings, verify public.truck_status is enabled in supabase_realtime. The SQL adds it when the publication exists without replacing any other publication entries.
6. Deploy the approved GitHub changes. Open the hidden #/owner route, sign in as an approved owner, and use Open truck / Close truck. In another browser, leave Home open and verify the sign updates and flips without a reload.

Customers can read status but cannot write it. Updates use a server-side function that verifies owner enrollment and checks the last-read version. Direct client table updates are not granted. An unapproved authenticated account must also be denied.

Realtime is the primary update path. A 30-second read-only resync handles missed events; visibility/online changes also refresh. None of these reads toggles the business status. Loading, detected offline state, and failed reads do not claim the truck is open. A lost connection may remain undetected briefly; do not treat this UI as an authorization boundary.

Test: owner A opens; customer sees open; owner B closes; customer sees closed. Verify anonymous and unapproved writes fail, concurrent outdated writes are rejected, reconnect refreshes, and reduced motion still works. SQL authorization and end-to-end device testing remain required after setup.

This is not the full shifts/photo/GPS/notifications workflow. Those features and menu/location privacy must be implemented separately; a status flip does not enforce their access rules. Do not use animation completion to authorize data access.
