import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Document } from "@/hooks/useDocument"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { File, FileText, Info, Layers, PanelTopDashed, SquareLibrary, User } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface Props {
    document: Document | null
    open: boolean
    onOpenChage: (open: boolean) => void
}

const getSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const getFileType = (type: string) => {
    if (type === 'text') type = "txt"
    return type.toUpperCase()
}

const DocumentDetailDialog = ({ document, open, onOpenChage }: Props) => {
    if (!document) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChage}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Document Details</DialogTitle>

                </DialogHeader>
                <div className="flex  items-center gap-2 ">
                    <span className="p-2 border bg-neutral-100 inline-block rounded-md">
                        <FileText className="text-blue-500" />
                    </span>
                    <div className="">

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <p className="max-w-60 truncate cursor-default">{document.filename}</p>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{document.filename}</p>
                            </TooltipContent>
                        </Tooltip>
                        <p className="text-xs text-muted-foreground">{getFileType(document.type)}</p>

                    </div>
                </div>
                <Tabs>
                    <TabsList variant={"line"}>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="content">Content</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview">
                        <Card className="p-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <FileText className="size-4" />
                                    <p className="text-sm ">Document Type</p>
                                </div>
                                <p >{getFileType(document.type)}</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="size-4" />
                                    <p className="text-sm ">Uploaded By</p>
                                </div>
                                <p >{format(new Date(document.created_at + "Z"), "d MMM yyyy HH:mm", { locale: th })}</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <SquareLibrary className="size-4" />
                                    <p className="text-sm ">Collection</p>
                                </div>
                                <p >{document.collection}</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Info className="size-4" />
                                    <p className="text-sm ">Status</p>
                                </div>
                                <p >Processed</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Layers className="size-4" />
                                    <p className="text-sm ">Vector Store</p>
                                </div>
                                <p >0.8.2</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <PanelTopDashed className="size-4" />
                                    <p className="text-sm ">Total Chunks</p>
                                </div>
                                <p>{document.chunk_count}</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <File className="size-4" />
                                    <p className="text-sm ">File Size</p>
                                </div>
                                <p>{getSize(document.total_chars)}</p>
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
export default DocumentDetailDialog