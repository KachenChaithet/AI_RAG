import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Document, useDocumentChunks } from "@/hooks/useDocument"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { File, FileText, Info, Layers, MousePointer, PanelTopDashed, ShieldAlert, SquareLibrary, User } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useState } from "react"

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
    const { data } = useDocumentChunks(document.id)

    const [selectedChunk, setSelectedChunk] = useState<string | null>(null)


    return (
        <Dialog open={open} onOpenChange={onOpenChage} >
            <DialogContent className="min-w-2xl max-h-200 overflow-hidden ">
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
                <Tabs className="flex flex-col gap-5  ">
                    <TabsList variant={"line"}>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="content">Content</TabsTrigger>
                    </TabsList>

                    {/* overview */}
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

                    {/* content */}
                    <TabsContent value="content">
                        <Card className="p-2 flex-row h-100 ">

                            <Card className="flex-1 select-none">
                                <CardHeader>
                                    <CardTitle className="text-sm">Document Structure</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-2 overflow-y-auto">
                                    {data?.map((item, i) => (
                                        <Card
                                            onClick={() => setSelectedChunk(item.content)}
                                            key={i}
                                            className={`p-2 shrink-0 flex  flex-row items-center ${selectedChunk === item.content && "bg-neutral-100"}`}

                                        >
                                            <p className="max-w-sm truncate">{item.content}</p>
                                            <p className="text-muted-foreground text-xs shrink-0">page {i + 1}</p>
                                        </Card>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card className="flex-1 ">
                                <CardHeader>
                                    <CardTitle className="text-sm">Document Content</CardTitle>
                                </CardHeader>
                                <CardContent className="overflow-y-auto h-full ">
                                    {selectedChunk ? (
                                        <p>{selectedChunk}</p>
                                    ) : (
                                        <div className=" h-full flex flex-col gap-2 justify-center items-center">
                                            <MousePointer />
                                            <p>Selected Page</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </Card>
                    </TabsContent>
                </Tabs>
            </DialogContent >
        </Dialog >
    )
}
export default DocumentDetailDialog