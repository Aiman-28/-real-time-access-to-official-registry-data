<template>
  <div class="pager" v-if="pagination">
    <div class="pinfo">Showing {{ pagination.from }}–{{ pagination.to }} of {{ pagination.total }}</div>
    <div class="pbtns">
      <button class="pbtn" :disabled="currentPage <= 1" @click="$emit('change-page', currentPage - 1)">‹ Prev</button>
      <button
        v-for="p in pageNumbers"
        :key="p"
        class="pbtn"
        :class="{ current: p === currentPage }"
        @click="$emit('change-page', p)"
      >
        {{ p }}
      </button>
      <button class="pbtn" :disabled="currentPage >= pagination.last_page" @click="$emit('change-page', currentPage + 1)">Next ›</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "Pagination",
  props: {
    pagination: { type: Object, default: null },
    currentPage: { type: Number, default: 1 },
  },
  emits: ["change-page"],
  computed: {
    pageNumbers() {
      if (!this.pagination) return [];
      const last = this.pagination.last_page;
      const cur = this.currentPage;
      const span = 2;
      const nums = new Set([1, last, cur]);
      for (let i = cur - span; i <= cur + span; i++) {
        if (i >= 1 && i <= last) nums.add(i);
      }
      return Array.from(nums).sort((a, b) => a - b);
    },
  },
};
</script>
