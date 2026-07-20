import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  isExpanded: boolean;
  toggleSidebar: () => void;
  setExpanded: (expanded: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isExpanded: true,
      toggleSidebar: () => set((state) => ({ isExpanded: !state.isExpanded })),
      setExpanded: (expanded: boolean) => set({ isExpanded: expanded }),
    }),
    {
      name: "sidebar-storage",
    },
  ),
);
