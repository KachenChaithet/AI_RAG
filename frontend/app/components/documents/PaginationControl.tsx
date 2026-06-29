import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

interface Props {
    page: number
    total: number
    limit: number
    onPageChange: (page: number) => void
}

const PaginationControl = ({ page, total, limit, onPageChange }: Props) => {
    const totalPages = Math.ceil(total / limit) // คำนวณหาหน้า pages ทั้งหมด

    if (totalPages <= 1) return null

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => ( // show pagination [1,2,3,...]
                    <PaginationItem key={p}>
                        <PaginationLink
                            onClick={() => onPageChange(p)}
                            isActive={page === p}
                            className="cursor-pointer"
                        >
                            {p}
                        </PaginationLink>
                    </PaginationItem>
                ))}

                <PaginationItem>
                    <PaginationNext
                        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                        className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    )
}

export default PaginationControl