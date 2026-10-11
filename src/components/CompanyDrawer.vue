<template>
  <div>
    <div class="scrim" @click="$emit('close')"></div>
    <aside class="drawer">
      <div class="drawer-head">
        <div>
          <h2>{{ detail ? detail.name : "Company details" }}</h2>
          <span v-if="detail" :class="statusChipClass(detail.status)">{{ detail.status || "unknown" }}</span>
        </div>
        <button class="drawer-close" @click="$emit('close')">✕</button>
      </div>

      <div class="loading-row" v-if="loading"><span class="spinner"></span> Loading detailed insights…</div>
      <div class="alert" v-if="error">{{ error }}</div>

      <template v-if="detail && !loading">
        <div class="kv-grid">
          <div class="kv"><div class="k">REGISTRATION NUMBER</div><div class="v mono">{{ val(detail.registration_number) }}</div></div>
          <div class="kv"><div class="k">COUNTRY</div><div class="v">{{ countryName }} <span class="mono" style="color:var(--text-dim)">({{ detail.country_code }})</span></div></div>
          <div class="kv"><div class="k">TYPE</div><div class="v">{{ val(detail.type) }}</div></div>
          <div class="kv"><div class="k">REGISTRATION DATE</div><div class="v">{{ val(detail.registration_date) }}</div></div>
          <div class="kv"><div class="k">INCORPORATION DATE</div><div class="v">{{ val(detail.incorporation_date) }}</div></div>
          <div class="kv"><div class="k">DISSOLUTION DATE</div><div class="v">{{ val(detail.dissolution_date) }}</div></div>
          <div class="kv"><div class="k">RISK LEVEL</div><div class="v"><span :class="statusChipClass(detail.risk_level)">{{ detail.risk_level || "unknown" }}</span></div></div>
          <div class="kv"><div class="k">VERIFICATION</div><div class="v"><span :class="statusChipClass(detail.verification_status)">{{ detail.verification_status || "unknown" }}</span></div></div>
          <div class="kv"><div class="k">FETCH STATUS</div><div class="v"><span :class="statusChipClass(detail.fetch_status)">{{ detail.fetch_status || "unknown" }}</span></div></div>
          <div class="kv"><div class="k">TAX NUMBER</div><div class="v mono">{{ val(detail.tax_number) }}</div></div>
          <div class="kv"><div class="k">INDUSTRIES</div><div class="v">{{ val(detail.industries) }}</div></div>
          <div class="kv"><div class="k">LAST UPDATED</div><div class="v">{{ val(detail.last_updated_at) }}</div></div>
        </div>

        <div class="drawer-section" v-if="detail.description">
          <h3>Description</h3>
          <div style="font-size: 12.5px; color: var(--text-muted); line-height: 1.6">{{ detail.description }}</div>
        </div>

        <div class="drawer-section" v-if="detail.addresses_detail && detail.addresses_detail.length">
          <h3>Addresses</h3>
          <div class="list-item" v-for="(a, i) in detail.addresses_detail" :key="i">
            <div class="li-name">{{ a.address || "—" }}</div>
            <div class="li-sub" v-if="a.type">{{ a.type }}</div>
          </div>
        </div>

        <div class="drawer-section" v-if="detail.people_detail && detail.people_detail.length">
          <h3>People</h3>
          <div class="list-item" v-for="(p, i) in detail.people_detail" :key="i">
            <div class="li-name">{{ p.name || "—" }}</div>
            <div class="li-sub">{{ p.designation || "Role unknown" }}<span v-if="p.status"> · {{ p.status }}</span></div>
          </div>
        </div>

        <div class="drawer-section" v-if="detail.beneficial_owners_detail && detail.beneficial_owners_detail.length">
          <h3>Beneficial owners</h3>
          <div class="list-item" v-for="(o, i) in detail.beneficial_owners_detail" :key="i">
            <div class="li-name">{{ o.name || "—" }}</div>
            <div class="li-sub">{{ o.designation || "Role unknown" }}<span v-if="o.nationality"> · {{ o.nationality }}</span></div>
          </div>
        </div>

        <div class="drawer-section" v-if="detail.previous_names_detail && detail.previous_names_detail.length">
          <h3>Previous names</h3>
          <div class="list-item" v-for="(n, i) in detail.previous_names_detail" :key="i">
            <div class="li-name">{{ n.company_name || "—" }}</div>
            <div class="li-sub" v-if="n.update_date">Changed {{ n.update_date }}</div>
          </div>
        </div>

        <div class="drawer-section" v-if="detail.documents_detail && detail.documents_detail.length">
          <h3>Documents</h3>
          <div class="list-item doc-item" v-for="(d, i) in detail.documents_detail" :key="i">
            <div>
              <div class="li-name">{{ d.title || d.document_type || "Document" }}</div>
              <div class="li-sub" v-if="d.document_status">{{ d.document_status }}</div>
            </div>

            <a
              v-if="docUrl(d)"
              :href="docUrl(d)"
              target="_blank"
              rel="noopener noreferrer"
              download
              class="download-btn"
            >
              ⬇ Download
            </a>
            <span v-else class="li-sub" style="flex-shrink:0">No file available</span>
          </div>
        </div>
      </template>
    </aside>
  </div>
</template>

<script>
export default {
  name: "CompanyDrawer",
  props: {
    detail: { type: Object, default: null },
    loading: { type: Boolean, default: false },
    error: { type: String, default: null },
    countries: { type: Array, default: () => [] },
  },
  emits: ["close"],
  computed: {
    countryName() {
      if (!this.detail) return "—";
      const match = this.countries.find((c) => c.code === this.detail.country_code);
      if (!match) return this.detail.country_code || "—";
      const label = match.state_name ? `${match.name} — ${match.state_name}` : match.name;
      return label.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
    },
  },
  methods: {
    val(v) {
      return v === null || v === undefined || v === "" ? "—" : v;
    },
    docUrl(d) {
      // API doesn't expose a separate document-download endpoint, so the
      // link (if any) must already be embedded in documents_detail.
      // Different possible field names are checked to be safe.
      return d.url || d.file_url || d.document_url || d.link || null;
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

<style scoped>
.doc-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.download-btn {
  flex-shrink: 0;
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid var(--border, #060621);
  background: var(--bg-elevated, #02051f);
  color: var(--text, #222);
  cursor: pointer;
  white-space: nowrap;
  text-decoration: none;
}
.download-btn:hover:not(:disabled) {
  background: var(--bg-hover, #09031f);
}
.download-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>