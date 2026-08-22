# Ankra Notes

A small notes API used to exercise the Ankra application flow end to end.

It is deliberately shaped like something a code-generation tool would emit and a
person would then push to GitHub without writing any Kubernetes YAML:

- **Needs a database.** `pg` against PostgreSQL, reading either `DATABASE_URL`
  or the discrete `PG*` variables. Ankra should detect this and propose one.
- **Needs a secret.** `PREVIEW_API_KEY` is a real third-party credential. The app
  degrades to "previews unavailable" without it rather than refusing to start,
  so a missing value shows up in the UI instead of as a crash loop.
- **Wants to be reachable.** It serves HTML on `/` and JSON under `/api`.
- **Has an honest readiness probe.** `/healthz` returns 503 until the database
  answers, so *started* and *serving* stay different facts.

There is intentionally no `.ankra/` directory: the point is to watch Ankra
generate the manifests itself.
