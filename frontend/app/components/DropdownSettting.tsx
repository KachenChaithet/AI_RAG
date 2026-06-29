import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SidebarMenuAction } from "@/components/ui/sidebar"
import RenameDialog from "./RenameDialog"
import { EllipsisVertical, LucideIcon, Trash } from "lucide-react"
import { useDeleteSession } from "@/hooks/useSession"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface DropdownSetttingProps {
    topic: string
    sessionId: number
    icon?: LucideIcon
    asSidebar?: boolean
    className?: string
}

const DropdownSettting = ({ topic, sessionId, icon: Icon = EllipsisVertical, asSidebar = false, className }: DropdownSetttingProps) => {
    const { mutate: mutateDeleteSession, isPending: isDeleteSession } = useDeleteSession()
    const [open, setOpen] = useState(false)

    return (
        <DropdownMenu open={open} onOpenChange={setOpen} >

            <DropdownMenuTrigger asChild className="">
                {asSidebar ? (
                    <SidebarMenuAction
                        className={`shrink-0 ${className}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Icon className="size-4" />
                    </SidebarMenuAction>
                ) : (
                    <Button
                        className={`shrink-0 ${className} ${open ? "opacity-100" : ""}`}
                        onClick={(e) => e.stopPropagation()}
                        variant={'ghost'}
                        size={'xs'}
                    >
                        <Icon className="size-4" />
                    </Button>
                )
                }

            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()} >
                <DropdownMenuGroup>
                    <RenameDialog sessionId={sessionId} topic={topic} />
                </DropdownMenuGroup>
                <DropdownMenuGroup>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                                variant="destructive"
                                disabled={isDeleteSession}
                                onSelect={(e) => e.preventDefault()}
                            >
                                <Trash className="size-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                                <AlertDialogDescription>
                                    คุณต้องการลบ "{topic}" หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                <AlertDialogAction onClick={() => mutateDeleteSession(sessionId)}>
                                    ลบ
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
export default DropdownSettting