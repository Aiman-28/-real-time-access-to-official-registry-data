<template>
  <div class="shell">
    <SearchSidebar
      :form="form"
      :countries="countries"
      :countries-loading="countriesLoading"
      :countries-error="countriesError"
      :can-search="canSearch"
      :searching="searching"
      :search-error="searchError"
      @search="performSearch"
      @retry-countries="fetchCountries"
    />

    <main class="main">
      <StatsBar
        :kyb-request="kybRequest"
        :country-label="selectedCountryLabel"
        :total="pagination ? pagination.total : kybResponses.length ? kybResponses.length : null"
        :resolved-count="resolvedCount"
        :pending-count="pendingCount"
        :active-count="activeCount"
        :polling="polling"
        :poll-interval-seconds="pollIntervalSeconds"
        @stop-polling="stopPolling"
      />

      <div class="alert" v-if="resultsError">{{ resultsError }}</div>

      <ResultsTable
        :rows="kybResponses"
        :countries="countries"
        :loading="searching || resultsLoading"
        @select="viewDetail"
      />

      <Pagination :pagination="pagination" :current-page="currentPage" @change-page="goToPage" />
    </main>

    <CompanyDrawer
      v-if="showDetail"
      :detail="detail"
      :loading="detailLoading"
      :error="detailError"
      :countries="countries"
      @close="closeDetail"
    />
  </div>
</template>

<script>
import SearchSidebar from "./components/SearchSidebar.vue";
import StatsBar from "./components/StatsBar.vue";
import ResultsTable from "./components/ResultsTable.vue";
import Pagination from "./components/Pagination.vue";
import CompanyDrawer from "./components/CompanyDrawer.vue";
import { getCountries, searchCompanies, getSearchResults, getCompanyDetail } from "./services/kybApi.js";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40; 

export default {
  name: "App",
  components: { SearchSidebar, StatsBar, ResultsTable, Pagination, CompanyDrawer },
  data() {
    return {
      // search form — passed to SearchSidebar and mutated there directly
      form: {
        token: "R8yiHMecCMJCJESv0zmaZcEdsJN4oRCj80wwXplPTYmJK1kSePjy2nJImzSloeTtDVToyUSbLgJAiV9OqYgZKfS5WZF8IEGJtTu1CK2LcoV5LrszLFm1mEF81694780415",
        searchMode: "name", // "name" | "registration_number"
        nameQuery: "",
        regNumberQuery: "",
        selectedCountryCode: "",
        searchType: "contains", // contains | start_with | fuzzy
        ttl: "",
        limit: 25,
      },

      // countries
      countries: [],
      countriesLoading: false,
      countriesError: null,

      // search / request state
      searching: false,
      searchError: null,
      kybRequest: null,
      kybResponses: [],
      pagination: null,

      // pagination
      currentPage: 1,
      resultsLoading: false,
      resultsError: null,

      // live polling
      polling: false,
      pollTimer: null,
      pollAttempts: 0,
      pollIntervalSeconds: POLL_INTERVAL_MS / 1000,

      // detail drawer
      showDetail: false,
      detailLoading: false,
      detailError: null,
      detail: null,
    };
  },

  computed: {
    resolvedCount() {
      return this.kybResponses.filter((r) => r.fetch_status === "resolved").length;
    },
    pendingCount() {
      return this.kybResponses.filter((r) => r.fetch_status !== "resolved").length;
    },
    activeCount() {
      return this.kybResponses.filter((r) => (r.status || "").toLowerCase() === "active").length;
    },
    canSearch() {
      const hasQuery =
        this.form.searchMode === "name"
          ? this.form.nameQuery.trim().length >= 3
          : this.form.regNumberQuery.trim().length >= 1;
      return hasQuery && !!this.form.selectedCountryCode && !this.searching;
    },
    requestIsPending() {
      return this.kybRequest && this.kybRequest.status === "pending";
    },
    selectedCountryLabel() {
      const match = this.countries.find((c) => c.code === this.form.selectedCountryCode);
      if (!match) return "";
      const label = match.state_name ? `${match.name} — ${match.state_name}` : match.name;
      return label.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
    },
  },

  mounted() {
    this.fetchCountries();
  },

  beforeUnmount() {
    this.stopPolling();
  },

  methods: {
    // ---------- 1) Supported Countries Listing ----------
    async fetchCountries() {
      this.countriesLoading = true;
      this.countriesError = null;
      try {
        this.countries = await getCountries(this.form.token);
      } catch (err) {
        this.countriesError = err.message || "Could not load the country list.";
      } finally {
        this.countriesLoading = false;
      }
    },

    // ---------- 2) Company Search ----------
    async performSearch() {
      if (!this.canSearch) return;
      this.stopPolling();
      this.searching = true;
      this.searchError = null;
      this.kybRequest = null;
      this.kybResponses = [];
      this.pagination = null;
      this.currentPage = 1;

      const payload = {
        country_codes: [this.form.selectedCountryCode],
        search_type: this.form.searchType,
      };
      if (this.form.searchMode === "name") {
        payload.name = this.form.nameQuery.trim();
      } else {
        payload.registration_number = this.form.regNumberQuery.trim();
      }
      if (this.form.ttl) payload.ttl = Number(this.form.ttl);

      try {
        const data = await searchCompanies(this.form.token, payload);
        this.kybRequest = data.kyb_request;
        this.kybResponses = data.kyb_responses || [];
        this.pagination = data.pagination || null;

        if (this.requestIsPending) this.startPolling();
      } catch (err) {
        this.searchError = err.message || "Something went wrong while searching.";
      } finally {
        this.searching = false;
      }
    },

    // ---------- 3) Company Search Results (pagination + polling refresh) ----------
    async fetchResults(page) {
      if (!this.kybRequest) return;
      this.resultsLoading = true;
      this.resultsError = null;
      try {
        const data = await getSearchResults(this.form.token, this.kybRequest.kyb_request_id, page, this.form.limit);
        this.kybRequest = data.kyb_request;
        this.kybResponses = data.kyb_responses || [];
        this.pagination = data.pagination || null;
        this.currentPage = page;

        if (!this.requestIsPending) this.stopPolling();
      } catch (err) {
        this.resultsError = err.message || "Could not refresh results.";
        this.stopPolling();
      } finally {
        this.resultsLoading = false;
      }
    },

    goToPage(page) {
      if (!this.pagination) return;
      if (page < 1 || page > this.pagination.last_page || page === this.currentPage) return;
      this.fetchResults(page);
    },

    // ---------- live polling: watch pending -> resolved ----------
    startPolling() {
      this.stopPolling();
      this.polling = true;
      this.pollAttempts = 0;
      this.pollTimer = setInterval(() => {
        this.pollAttempts += 1;
        if (this.pollAttempts > MAX_POLL_ATTEMPTS) {
          this.stopPolling();
          return;
        }
        this.fetchResults(this.currentPage);
      }, POLL_INTERVAL_MS);
    },

    stopPolling() {
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
      this.polling = false;
    },

    // ---------- 4) Detailed Company Insights ----------
    async viewDetail(row) {
      this.showDetail = true;
      this.detail = null;
      this.detailError = null;
      this.detailLoading = true;
      try {
        this.detail = await getCompanyDetail(this.form.token, row.kyb_response_id);
      } catch (err) {
        this.detailError = err.message || "Could not load company details.";
      } finally {
        this.detailLoading = false;
      }
    },

    closeDetail() {
      this.showDetail = false;
      this.detail = null;
      this.detailError = null;
    },
  },
};
</script>
