<template>
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-mark"></span>
      <span class="brand-name">KYB Registry Console</span>
    </div>
    <p class="brand-sub">
      Live company verification across official business registries — search by name or registration number.
    </p>

    <div class="field">
      <label for="token">API token</label>
      <input id="token" type="text" class="mono" v-model="form.token" placeholder="YOUR_SECRET_KEY" />
      <div class="hint">
        Sent as the <code>token</code> header on every request. Kept in memory only for this session — nothing is written to storage.
      </div>
    </div>

    <hr class="div" />

    <div class="field">
      <label>Search by</label>
      <div class="seg">
        <button :class="{ active: form.searchMode === 'name' }" @click="form.searchMode = 'name'">Company name</button>
        <button :class="{ active: form.searchMode === 'registration_number' }" @click="form.searchMode = 'registration_number'">Reg. number</button>
      </div>
    </div>

    <div class="field" v-if="form.searchMode === 'name'">
      <label for="nameQuery">Company name</label>
      <input id="nameQuery" type="text" v-model="form.nameQuery" placeholder="e.g. Testing Company" minlength="3" maxlength="128" />
      <div class="hint">3–128 characters.</div>
    </div>
    <div class="field" v-else>
      <label for="regQuery">Registration number</label>
      <input id="regQuery" type="text" class="mono" v-model="form.regNumberQuery" placeholder="e.g. 12345" maxlength="255" />
    </div>

    <!-- ===== Country / state selector ===== -->
    <div class="field">
      <label>Country / state</label>
      <input type="text" v-model="countrySearch" placeholder="Filter countries…" style="margin-bottom: 8px" />
      <select v-model="form.selectedCountryCode" class="mono" :disabled="countriesLoading">
        <option value="" disabled>{{ countriesLoading ? "Loading countries…" : "Select a country" }}</option>
        <option v-for="c in filteredCountries" :key="c.code" :value="c.code">
          {{ formatLabel(c) }} — {{ c.code }}
        </option>
      </select>

      <div class="hint" v-if="selectedCountry">
        Searching in <strong>{{ formatLabel(selectedCountry) }}</strong>
        <span class="mono">({{ selectedCountry.code }})</span>
      </div>

      <div class="hint" v-if="countriesError">
        {{ countriesError }} — <a href="#" @click.prevent="$emit('retry-countries')">retry</a>
      </div>
      <div class="hint" v-else-if="!selectedCountry">
        Only one country or state can be searched at a time.
      </div>
    </div>

    <div class="field">
      <label>Search type</label>
      <div class="radio-row">
        <label class="radio-opt" :class="{ active: form.searchType === 'contains' }">
          <input type="radio" value="contains" v-model="form.searchType" />
          <span><span class="ro-label">Contains</span><div class="ro-desc">Keyword appears anywhere in the name.</div></span>
        </label>
        <label class="radio-opt" :class="{ active: form.searchType === 'start_with' }">
          <input type="radio" value="start_with" v-model="form.searchType" />
          <span><span class="ro-label">Starts with</span><div class="ro-desc">Name begins with the entered characters.</div></span>
        </label>
        <label class="radio-opt" :class="{ active: form.searchType === 'fuzzy' }">
          <input type="radio" value="fuzzy" v-model="form.searchType" />
          <span><span class="ro-label">Fuzzy</span><div class="ro-desc">Approximate matches, tolerant of typos.</div></span>
        </label>
      </div>
    </div>

    <div class="field">
      <label for="ttl">TTL — seconds (optional)</label>
      <input id="ttl" type="number" min="60" class="mono" v-model="form.ttl" placeholder="min. 60" />
    </div>

    <div class="field">
      <label for="limit">Results per page</label>
      <input id="limit" type="number" min="1" max="100" class="mono" v-model.number="form.limit" />
    </div>

    <button class="btn" :disabled="!canSearch" @click="$emit('search')">
      {{ searching ? "Searching…" : "Run KYB search" }}
    </button>

    <div class="alert" v-if="searchError">{{ searchError }}</div>
  </aside>
</template>

<script>
export default {
  name: "SearchSidebar",
  props: {
    form: { type: Object, required: true },
    countries: { type: Array, default: () => [] },
    countriesLoading: { type: Boolean, default: false },
    countriesError: { type: String, default: null },
    canSearch: { type: Boolean, default: false },
    searching: { type: Boolean, default: false },
    searchError: { type: String, default: null },
  },
  emits: ["search", "retry-countries"],
  data() {
    return {
      countrySearch: "",
    };
  },
  computed: {
    filteredCountries() {
      const q = this.countrySearch.trim().toLowerCase();
      if (!q) return this.countries;
      return this.countries.filter((c) => {
        const label = (c.state_name ? `${c.name} ${c.state_name}` : c.name) + " " + c.code;
        return label.toLowerCase().includes(q);
      });
    },
    selectedCountry() {
      return this.countries.find((c) => c.code === this.form.selectedCountryCode) || null;
    },
  },
  methods: {
    formatLabel(c) {
      const base = c.state_name ? `${c.name} — ${c.state_name}` : c.name;
      return base.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
    },
  },
};
</script>
