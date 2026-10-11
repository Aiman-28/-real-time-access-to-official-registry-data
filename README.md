# KYB Registry Console (Vue 3 + Vite)

A Vue.js app (Options API) for TheKYB's `kyb_check_v2` service. It calls all four
documented endpoints, shows the full country name against every result, polls
live until pending requests resolve, and handles pagination.

## Project structure

```
kyb-vue-app/
  index.html
  package.json
  vite.config.js
  src/
    main.js
    App.vue                  # owns all state, wires everything together
    style.css                # shared design tokens / styles
    services/
      kybApi.js               # the 4 API calls (countries, search, results, detail)
    components/
      SearchSidebar.vue       # name/registration search, search_type, country picker
      StatsBar.vue            # total / resolved / pending / active counters + live banner
      ResultsTable.vue        # results grid, shows full country name per row
      Pagination.vue          # page controls
      CompanyDrawer.vue       # full "Detailed Company Insights" panel
```

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (default `http://localhost:5173`).

## API token

Paste your `token` (from TheKYB dashboard) into the "API token" field in the
sidebar. It is kept only in the component's in-memory state for the current
session — it is never written to `localStorage`/`sessionStorage`, and nothing
about a search is persisted between reloads.

## Note on CORS

The app calls `https://api.thekyb.com/v2/...` directly from the browser. If
TheKYB's API does not send permissive CORS headers for browser origins, these
requests will fail with a network/CORS error in the browser console. In that
case, proxy the three endpoints through your own backend (same request/response
shape) and change `API_BASE` in `src/services/kybApi.js` to point at your proxy.

## What each endpoint does here

1. **`GET /v2/countries`** — populates the country/state dropdown; full names
   (title-cased) are shown, not just codes — used in the sidebar, results
   table's "Country" column, and the detail drawer.
2. **`POST /v2/kyb`** — creates the KYB request from name/registration number +
   country + search type; starts live polling if `status` comes back `pending`.
3. **`GET /v2/kyb?kyb_request_id=&page=&limit=`** — used both for manual
   pagination and for the polling refresh; drives the resolved/pending counters.
4. **`GET /v2/kyb/{kyb_response_id}`** — loaded when a result row is clicked,
   rendered in the detail drawer.
