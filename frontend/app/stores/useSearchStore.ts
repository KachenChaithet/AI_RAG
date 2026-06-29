import { create } from 'zustand'

interface SearchStore {
    isOpen: boolean
    setOpen: (isOpen: boolean) => void
}

export const useSearchStore = create<SearchStore>((set) => ({
    isOpen: false,
    setOpen: (isOpen) => set({ isOpen: isOpen })
}))