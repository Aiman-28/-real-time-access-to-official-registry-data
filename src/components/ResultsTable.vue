<template>
  <div>
    <div v-if="!rows.length && !loading" class="empty">
      <div class="big">No search run yet</div>
      Enter a company name or registration number on the left, pick a country, and run a search.
    </div>

    <template v-else>
      <table v-if="rows.length">
        <thead>
          <tr>
            <th>Company</th>
            <th>Country</th>
            <th>Registration No.</th>
            <th>Type</th>
            <th>Status</th>
            <th>Risk</th>
            <th>Verification</th>
            <th>Fetch</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.kyb_response_id" @click="$emit('select', row)">
            <td>
              <div class="cname">{{ row.name }}</div>
            </td>
            <td>
              <div>{{ countryName(row.country_code) }}</div>
              <div class="ccode mono">{{ row.country_code }}</div>
            </td>
            <td class="mono">{{ row.registration_number || "—" }}</td>
            <td>{{ row.type || "—" }}</td>
            <td><span :class="statusChipClass(row.status)">{{ row.status || "unknown" }}</span></td>
            <td><span :class="statusChipClass(normalizeRisk(row.risk_level))">{{ row.risk_level || "unknown" }}</span></td>
            <td><span :class="statusChipClass(row.verification_status)">{{ row.verification_status || "unknown" }}</span></td>
            <td><span :class="statusChipClass(row.fetch_status)">{{ row.fetch_status || "unknown" }}</span></td>
          </tr>
        </tbody>
      </table>

      <div class="loading-row" v-if="loading">
        <span class="spinner"></span> {{ rows.length ? "Refreshing…" : "Creating KYB request…" }}
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: "ResultsTable",
  props: {
    rows: { type: Array, default: () => [] },
    countries: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
  },
  emits: ["select"],
  computed: {
    countryMap() {
      const map = {};
      for (const c of this.countries) {
        const label = c.state_name ? `${c.name} — ${c.state_name}` : c.name;
        map[c.code] = label.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
      }
      return map;
    },
  },
  methods: {
    countryName(code) {
      return this.countryMap[code] || this.countryMap[(code || "").toUpperCase()] || code || "—";
    },
    normalizeRisk(risk) {
      const r = (risk || "").toLowerCase();
      if (r === "low" || r === "low_risk") return "active";
      return r;
    },
    statusChipClass(status) {
      const s = (status || "").toLowerCase();
      if (["active", "verified", "resolved", "compliant"].includes(s)) return "chip c-verify";
      if (["pending", "in_progress", "processing"].includes(s)) return "chip c-pending";
      if (["dissolved", "failed", "inactive", "rejected"].includes(s)) return "chip c-fail";
      return "chip c-neutral";
    },
  },
};
</script>
