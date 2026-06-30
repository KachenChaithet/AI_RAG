"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Document, useDeleteDocument, useDocuments } from "@/hooks/useDocument"
import { Download, Ellipsis, Eye, Pencil, Trash } from "lucide-react"
import { format } from 'date-fns'
import { th } from "date-fns/locale"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import DocumentDetailDialog from "./DocumentDetailDialog"
import { useState } from "react"
import EditFilenameDialog from "./EditFilenameDialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import api from "@/lib/axios"

interface TableDocumentProps {
    data: Document[]

}

const getFileType = (type: string) => {
    if (type === "text") type = "txt"
    return type.toUpperCase()
}

const TableDocument = ({ data }: TableDocumentProps) => {
    const { mutate } = useDeleteDocument()
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
    const [editDoc, setEditDoc] = useState<Document | null>(null)

    const handDownload = async (docId: number, filename: string) => {
        filename = filename.split('.').slice(0, -1).join('.')
        const response = await api.get(`/document/${docId}/download`,
            {
                withCredentials: true,
                responseType: "blob"
            }
        )

        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement("a")
        link.href = url
        link.setAttribute("download", `${filename}.txt`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
    }

    return (
        <>
            <Table className=" ">
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Chunks</TableHead>
                        <TableHead>Collection</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data?.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="max-w-xs truncate">{item.filename}</TableCell>
                            <TableCell>{getFileType(item.type)}</TableCell>
                            <TableCell>{item.chunk_count}</TableCell>
                            <TableCell>{item.collection}</TableCell>
                            <TableCell>{format(new Date(item.created_at + "Z"), "d MMM yyyy HH:mm", { locale: th })}</TableCell>
                            <TableCell className="flex gap-2" >
                                <Button
                                    variant={'outline'}
                                    size={'icon-sm'}
                                    className="rounded-full"
                                    onClick={() => setSelectedDoc(item)}
                                >
                                    <Eye className="size-4" />
                                </Button>

                                <Button
                                    variant={'outline'}
                                    size={'icon-sm'}
                                    className="rounded-full"
                                    onClick={() => setEditDoc(item)}
                                >
                                    <Pencil className="size-4" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant={'outline'} size={'icon-sm'} className="rounded-full">
                                            <Ellipsis className="size-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => handDownload(item.id, item.filename)}>
                                            <Download className="size-4" />
                                            Dowload
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant={'destructive'} size={'icon-sm'} className="rounded-full">
                                            <Trash className="size-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                คุณต้องการลบ "{item.filename}" หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => mutate(item.id)}>
                                                ลบ
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <DocumentDetailDialog
                document={selectedDoc}
                open={!!selectedDoc}
                onOpenChage={(open) => { if (!open) setSelectedDoc(null) }}
            />
            <EditFilenameDialog
                document={editDoc}
                open={!!editDoc}
                onOpenChange={(open) => { if (!open) setEditDoc(null) }}

            />
        </>
    )
}
export default TableDocument