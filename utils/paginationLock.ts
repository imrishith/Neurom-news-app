// utils/paginationLock.ts

/**
 * Global Scroll Pagination Lock
 * - Prevents duplicate loadMore calls
 * - Resets only after API completes
 * - Safe across re-renders, component mounts, Zustand updates
 */

export const PaginationLock = {
  isLocked: false,

  lock() {
    this.isLocked = true;
  },

  unlock() {
    this.isLocked = false;
  }
};
