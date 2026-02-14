import { useCallback, useEffect, useSyncExternalStore } from "react";
import { getGalleries, type Gallery } from "./gallery";

let cachedGalleries: Gallery[] = [];
let initialized = false;
let loading = true;
let hasLoadedOnce = false;
let listeners: Array<() => void> = [];
const EMPTY_GALLERIES: Gallery[] = [];
const SERVER_LOADING = true;

function emitChange() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot() {
  return cachedGalleries;
}

function getLoadingSnapshot() {
  return loading;
}

function getServerGalleriesSnapshot() {
  return EMPTY_GALLERIES;
}

function getServerLoadingSnapshot() {
  return SERVER_LOADING;
}

async function refreshStore(options?: { showLoading?: boolean }) {
  const shouldShowLoading = options?.showLoading ?? !hasLoadedOnce;
  if (shouldShowLoading) {
    loading = true;
    emitChange();
  }
  try {
    cachedGalleries = await getGalleries();
  } catch {
    cachedGalleries = [];
  }
  hasLoadedOnce = true;
  loading = false;
  emitChange();
}

export function useGalleries() {
  const galleries = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerGalleriesSnapshot,
  );
  const isLoading = useSyncExternalStore(
    subscribe,
    getLoadingSnapshot,
    getServerLoadingSnapshot,
  );

  const refresh = useCallback(async () => {
    await refreshStore();
  }, []);

  useEffect(() => {
    if (!initialized) {
      initialized = true;
      void refreshStore({ showLoading: true });
    } else {
      void refreshStore();
    }
  }, []);

  return { galleries, refresh, isLoading };
}
