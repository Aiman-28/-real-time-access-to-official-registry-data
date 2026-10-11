<template>
  <div>
    <div class="topbar">
      <div>
        <h1>Search results</h1>
        <div class="req-meta" v-if="kybRequest">
          request <code class="mono">{{ kybRequest.kyb_request_id }}</code>
          <template v-if="countryLabel"> &nbsp;·&nbsp; country <strong>{{ countryLabel }}</strong></template>
          &nbsp;·&nbsp; status
          <span :class="statusChipClass(kybRequest.status)" style="margin-left: 4px">{{ kybRequest.status }}</span>
        </div>
        <div class="req-meta" v-else>Run a search from the left panel to see live registry data here.</div>
      </div>

      <div class="stats" v-if="total !== null">
        <div class="stat">
          <div class="num mono">{{ total }}</div>
          <div class="lab">TOTAL MATCHES</div>
        </div>
        <div class="stat verify">
          <div class="num mono">{{ resolvedCount }}</div>
          <div class="lab">RESOLVED</div>
        </div>
        <div class="stat pending">
          <div class="num mono">{{ pendingCount }}</div>
          <div class="lab">PENDING</div>
        </div>
        <div class="stat">
          <div class="num mono">{{ activeCount }}</div>
          <div class="lab">ACTIVE</div>
        </div>
      </div>
    </div>

    <div class="live-banner" v-if="polling">
      <span class="live-dot"></span>
      Live verification running — refreshing every {{ pollIntervalSeconds }}s until every record resolves.
      <button class="stop" @click="$emit('stop-polling')">Stop</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "StatsBar",
  props: {
    kybRequest: { type: Object, default: null },
    countryLabel: { type: String, default: "" },
    total: { type: Number, default: null },
    resolvedCount: { type: Number, default: 0 },
    pendingCount: { type: Number, default: 0 },
    activeCount: { type: Number, default: 0 },
    polling: { type: Boolean, default: false },
    pollIntervalSeconds: { type: Number, default: 4 },
  },
  emits: ["stop-polling"],
  methods: {
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
