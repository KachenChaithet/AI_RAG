"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/useDebounce"
import { useDeleteSessions, useSessions } from "@/hooks/useSession"
import { formatDistanceToNow } from "date-fns"
import { th } from "date-fns/locale"
import { EllipsisVertical, Loader2, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import DropdownSettting from "../../components/DropdownSettting"
import { Checkbox } from "@/components/ui/checkbox"



const page = () => {
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 300)
    const { data, isLoading, isFetching } = useSessions(undefined, undefined, debouncedSearch)
    const { mutate, isError } = useDeleteSessions()
    const router = useRouter()

    const [selectMode, setSelectMode] = useState(false)
    const [selected, setSelected] = useState<number[]>([])

    const toggleSelect = (id: number) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const isAllSelected = (data?.length ?? 0) > 0 && data?.length === selected.length

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelected([])
        } else {
            setSelected(data?.map(item => item.id) ?? [])
        }
    }

    const handleDeleteSessions = () => {
        if (selected.length === 0) return
        mutate(selected, {
            onSuccess: (data) => {
                console.log(data);

            }
        })
    }



    return (
        <div className="h-full flex flex-col ">
            <div className="max-w-4xl mx-auto w-full mt-10 flex flex-col gap-4">
                <header className="flex items-center justify-between">
                    <p className="text-3xl font-extralight">Chats</p>
                    <div className="flex gap-2 items-center">
                        {selectMode ? (
                            <>
                                <span>{selected.length} selected</span>
                                <Button
                                    onClick={() => toggleSelectAll()}
                                >
                                    Select all
                                </Button>
                                <Button
                                    disabled={selected.length === 0}
                                    onClick={handleDeleteSessions}
                                >
                                    Delete
                                </Button>
                                <Button
                                    onClick={() => {
                                        setSelectMode(false)
                                        setSelected([])
                                    }}
                                    variant={"ghost"}
                                >
                                    Cancel
                                </Button>


                            </>
                        ) : (
                            <>
                                <Button onClick={() => setSelectMode(true)}>Select chats</Button>
                                <Button variant={'outline'} onClick={() => router.push("/")}>New chat</Button>

                            </>
                        )}
                    </div>
                </header>
                <div className="rounded-md border flex items-center p-1 bg-neutral-200">
                    <span className="px-2">
                        <Search className="size-4 text-neutral-400 shrink-0" />
                    </span>
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border-none outline-0 focus-visible:ring-0 bg-transparent placeholder:font-bold"
                        placeholder="Search chats..."
                    />

                    {isFetching && (
                        <Loader2 className="size-4 animate-spin" />
                    )}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto mt-4 ">
                <div className="md:max-w-4xl  mx-auto">
                    {data?.map((item, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between px-4 py-3 hover:bg-neutral-100 cursor-pointer border-b group"
                            onClick={() => {
                                if (selectMode) {
                                    toggleSelect(item.id)
                                } else {
                                    router.push(`/chat/${item.id}`)
                                }
                            }}
                        >
                            <div className="flex items-baseline gap-2 ">
                                {selectMode && (
                                    <Checkbox
                                        checked={selected.includes(item.id)}
                                        onCheckedChange={() => toggleSelect(item.id)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                )}
                                <span className="font-medium md:text-lg text-sm  cursor-pointer truncate block md:max-w-165 max-w-50">{item.topic}</span>
                                <span className="text-xs text-neutral-400">
                                    {formatDistanceToNow(new Date(item.created_at + "Z"), {
                                        addSuffix: true,
                                        locale: th
                                    })}
                                </span>
                            </div>
                            <DropdownSettting sessionId={item.id} topic={item.topic} key={item.id} className="md:opacity-0 md:aria-expanded:opacity-100 opacity-100 md:group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}

                </div>
            </div>
        </div>
    )
}
export default page