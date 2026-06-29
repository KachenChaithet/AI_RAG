import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Funnel, Search } from "lucide-react"

const Navbar = ({ onUploadClick, onPageChange, onSearchChange, page, search, total, onTypeFilter, typeFilter }: {
    onUploadClick: () => void, search: string
    onSearchChange: (val: string) => void
    total: number
    typeFilter: string
    onTypeFilter: (val: string) => void
    page: number
    onPageChange: (page: number) => void
}) => {
    return (
        <div className="flex justify-between items-center">
            <div className="">
                <p className="font-extralight text-2xl">Documents</p>
                <p className="text-xs text-muted-foreground">Manage your documents and knowledge base</p>
            </div>
            <div className="flex items-center gap-2">
                <div className="rounded-md border flex items-center p-1 bg-neutral-200 max-w-xs">
                    <span>
                        <Search className="size-4 text-neutral-400 shrink-0" />
                    </span>
                    <Input
                        className="border-none outline-0 focus-visible:ring-0 bg-transparent"
                        placeholder="Search documents"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size={'lg'} variant={'outline'}>
                            <Funnel />
                        </Button>

                    </DropdownMenuTrigger>
                    <DropdownMenuContent>

                        <DropdownMenuItem onClick={() => onTypeFilter("")}>
                            ALL
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onTypeFilter("pdf")}>
                            PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onTypeFilter("docx")}>
                            DOCX
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onTypeFilter("text")}>
                            TXT
                        </DropdownMenuItem>
                    </DropdownMenuContent>

                </DropdownMenu>

                <Button onClick={onUploadClick} variant={"outline"}>
                    Upload RAG
                </Button>
            </div>
        </div>
    )
}
export default Navbar