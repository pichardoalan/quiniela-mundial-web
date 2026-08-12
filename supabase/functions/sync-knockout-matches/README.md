# Sincronización de eliminatorias

La función `sync-knockout-matches` descarga los partidos de la API de Football-Data y actualiza la tabla `partidos`. Solo permite invocaciones del usuario administrador configurado en `index.ts`.


```sh
supabase secrets set FOOTBALL_DATA_TOKEN="tu-token"
supabase secrets set FOOTBALL_DATA_COMPETITION_ID="2000"
supabase functions deploy sync-knockout-matches
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` son provistos por Supabase en el entorno de la función.
