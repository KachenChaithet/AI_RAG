import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, LucideIcon } from "lucide-react"

interface CardDocumentProps {
    total: number | string
    title: string
    icon?: LucideIcon
    iconClassName?: string

}

const CardDocument = ({ total, title, icon: Icon = FileText, iconClassName }: CardDocumentProps) => {
    return (
        <Card className=" w-full md:max-w-60 flex-1 select-none">
            <CardHeader className="flex justify-between items-center">
                <div className="">
                    <CardDescription className="text-xl font-semibold">{total}</CardDescription>
                    <CardTitle>{title}</CardTitle>
                </div>
                <Icon className={iconClassName} />
            </CardHeader>
        </Card>
    )
}
export default CardDocument