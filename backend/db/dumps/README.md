# Database dumps

`ala-20261022.sql` is a full dump (schema and data) of the local `ala` database, taken before the old
laptop was wiped. It keeps the LLM-generated content (the generated curriculum, PCA cards and details)
and the `llm_calls` log, so they don't have to be regenerated. The dump contains no secrets.

Restore it into a fresh database with no tables (start Docker first, and don't run migrations or seed beforehand):

```bash
docker compose up -d
docker compose exec -T db psql -U ala -d ala < backend/db/dumps/ala-20261022.sql
```

This is temporary. Remove it from git once it has been restored.
