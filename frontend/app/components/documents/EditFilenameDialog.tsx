import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Document, useUpdateFilename } from "@/hooks/useDocument"
import { useEffect, useState } from "react"

interface Props {
    document: Document | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

const EditFilenameDialog = ({ document, open, onOpenChange }: Props) => {
    const [filename, setFilename] = useState(document?.filename ?? '')
    const { mutate, isPending } = useUpdateFilename()

    useEffect(() => {
        if (document) setFilename(document.filename)
    }, [document])

    const handleEdit = () => {
        if (filename === document?.filename) return
        if (!document) return
        mutate({ documentId: document?.id, filename: filename }, {
            onSuccess: () => onOpenChange(false)
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Filename</DialogTitle>
                </DialogHeader>
                <Input
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleEdit()
                    }}
                />
                <DialogFooter>
                    <Button
                        variant={'outline'}
                        onClick={() => onOpenChange(false)}
                    >
                        cancle
                    </Button>
                    <Button
                        onClick={handleEdit}
                        disabled={isPending}

                    >
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
export default EditFilenameDialog