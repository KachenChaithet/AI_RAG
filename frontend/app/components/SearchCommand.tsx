"use client"
import { Command, CommandInput, CommandList, CommandItem, CommandGroup, CommandEmpty } from "@/components/ui/command"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useSessions } from "@/hooks/useSession"
import { usePathname, useRouter } from "next/navigation"
import { useSearchStore } from "../stores/useSearchStore"
import { useState } from "react"
import { useDebounce } from "@/hooks/useDebounce"

export default function SearchCommand() {
    const { isOpen, setOpen } = useSearchStore()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 300)
    const pathname = usePathname()
    const isAdminContext = pathname.startsWith("/admin")



    const { data } = useSessions(undefined, undefined, debouncedSearch, isAdminContext ? "admin" : "user", { enabled: isOpen })
    const router = useRouter()




    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogContent className="p-0 overflow-hidden max-w-lg w-full">
                <DialogTitle className="sr-only">Search</DialogTitle>
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="ค้นหา chat..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        <CommandEmpty>ไม่พบผลลัพธ์</CommandEmpty>
                        <CommandGroup >
                            {data?.map(item => (
                                <CommandItem key={item.id} onSelect={() => {
                                    router.push(isAdminContext ? `/admin/chat/${item.id}` : `/chat/${item.id}`)
                                    setOpen(false)
                                }}>
                                    <span className="truncate">{item.topic}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    )
}