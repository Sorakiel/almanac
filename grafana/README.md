# Grafana

`almanac-usage.json` is the dashboard, kept here so it is version-controlled
rather than living only in Grafana's database. It reads the `analytics` schema
created by migration `0027` — aggregate views only, never rows.

The dashboard picks its database through a `datasource` template variable, so the
same JSON works against staging and production without editing uids.

## Connecting a Supabase project

1. Give the reader role a password. It is created without one by the migration,
   because a password in a migration is a password in a public repository:

   ```sql
   alter role analytics_reader with password '<generated>';
   ```

2. Add a PostgreSQL data source in Grafana:

   | Field        | Value                                     |
   | ------------ | ----------------------------------------- |
   | Host         | `aws-1-<region>.pooler.supabase.com:5432` |
   | Database     | `postgres`                                |
   | User         | `analytics_reader.<project-ref>`          |
   | TLS/SSL Mode | `require`                                 |

   Use the **pooler**, not `db.<ref>.supabase.co` — the direct host is IPv6-only
   and Grafana Cloud cannot reach it. Port 5432 is session mode; the transaction
   pooler on 6543 does not support the prepared statements Grafana issues.

   The `aws-0` vs `aws-1` prefix is per project, not per region: `aws-0` returns
   `FATAL: (ENOTFOUND) tenant/user … not found` for a project that lives on
   `aws-1`, which reads like a credentials problem but is not one. Check the
   connection string in the Supabase dashboard if the health check fails.

3. Import `almanac-usage.json` (Dashboards → New → Import) and pick the data
   source.

## What the reader can and cannot see

`analytics_reader` has `USAGE` on `analytics` and `SELECT` on its views, and
nothing else — `select … from public.reflections` returns `permission denied`.
The views themselves run with the owner's privileges and so cross RLS, which is
the only way a cross-user aggregate can work. That is precisely why every column
in them is a count or a date: the schema is one careless `select name` away from
being a data leak with a public dashboard attached.
