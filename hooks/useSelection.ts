import { useState, useCallback } from "react";

export const useSelection = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setSelectionMode(false);
  }, []);

  const startSelection = useCallback((id: string) => {
    setSelectedIds([id]);
    setSelectionMode(true);
  }, []);

  return {
    selectedIds,
    selectionMode,
    toggleSelection,
    clearSelection,
    startSelection,
    setSelectedIds,
  };
};
