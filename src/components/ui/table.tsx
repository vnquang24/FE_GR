import * as React from 'react'
import {cn} from '@/lib/utils'

const Table = React.forwardRef<
    HTMLTableElement,
    React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
        <table
            ref={ref}
            className={cn('w-full caption-bottom text-sm', className)}
            {...props}
        />
    </div>
))
Table.displayName = 'Table'

const TableHeader = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
))

TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <tbody
        ref={ref}
        className={cn('[&_tr:last-child]:border-b', className)}
        {...props}
    />
))
TableBody.displayName = 'TableBody'

const TableFooter = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <tfoot
        ref={ref}
        className={cn(
            'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0 ',
            className
        )}
        {...props}
    />
))
TableFooter.displayName = 'TableFooter'

const TableRow = React.forwardRef<
    HTMLTableRowElement,
    React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
    <tr
        ref={ref}
        className={cn(
            'border-b transition-colors data-[state=selected]:bg-muted ',
            className
        )}
        {...props}
    />
))
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<
    HTMLTableCellElement,
    React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <th
        ref={ref}
        className={cn(
            'h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] text-white border-x',
            className
        )}
        {...props}
    />
))
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<
    HTMLTableCellElement,
    React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <td
        ref={ref}
        className={cn(
            'p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] border-x',
            className
        )}
        {...props}
    />
))
TableCell.displayName = 'TableCell'

const TableCaption = React.forwardRef<
    HTMLTableCaptionElement,
    React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
    <caption
        ref={ref}
        className={cn('mt-4 text-sm text-muted-foreground', className)}
        {...props}
    />
))
TableCaption.displayName = 'TableCaption'

interface TableWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode
    headings?: string[]
    variant?: 'default' | 'striped' | 'border'
    noHeader?: boolean
    data?: Array<Record<string, any>>
    columns?: Array<{
        header: string
        accessorKey?: string
        cell?: (item: any, index: number) => React.ReactNode
        className?: string
    }>
    emptyState?: React.ReactNode
    isLoading?: boolean
    loadingComponent?: React.ReactNode
    spacing?: 'none' | 'sm' | 'md' | 'lg'
}

const TableWrapper = ({
    children,
    headings = [],
    className,
    variant = 'default',
    noHeader = false,
    data = [],
    columns = [],
    emptyState,
    isLoading = false,
    loadingComponent,
    spacing = 'md',
    ...props
}: TableWrapperProps) => {
    const variantStyles = {
        default: '',
        striped: '[&_tbody_tr:nth-child(odd)]:bg-muted/50',
        border: 'border border-border rounded-md'
    }
    
    const spacingStyles = {
        none: '',
        sm: 'pt-2',
        md: 'pt-4',
        lg: 'pt-6'
    }

    const tableHeadings = columns.length > 0 
        ? columns.map(col => col.header)
        : headings;

    const renderEmptyState = () => {
        if (emptyState) return emptyState;
        
        return (
            <TableRow>
                <TableCell 
                    colSpan={tableHeadings.length || 1} 
                    className="text-center py-10 text-gray-500"
                >
                    Không có dữ liệu
                </TableCell>
            </TableRow>
        );
    };

    const renderLoadingState = () => {
        if (loadingComponent) return loadingComponent;
        
        return (
            <TableRow>
                <TableCell 
                    colSpan={tableHeadings.length || 1} 
                    className="text-center py-10"
                >
                    <span className="flex items-center justify-center">
                        <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></span>
                        <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
                    </span>
                </TableCell>
            </TableRow>
        );
    };

    return (
        <div className={cn('w-full', spacingStyles[spacing], className)} {...props}>
            <Table className={cn('w-full', variantStyles[variant])}>
                {!noHeader && tableHeadings.length > 0 && (
                    <TableHeader className="bg-blue-300">
                        <TableRow>
                            {tableHeadings.map((heading, index) => (
                                <TableHead 
                                    key={`heading-${index}`}
                                    className={cn('font-semibold text-gray-700', 
                                        columns[index]?.className)}
                                >
                                    {heading}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                )}
                
                {children ? (
                    children
                ) : (
                    <TableBody>
                        {isLoading ? (
                            renderLoadingState()
                        ) : data.length > 0 ? (
                            data.map((item, rowIndex) => (
                                <TableRow 
                                    key={`row-${rowIndex}`}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    {columns.map((column, colIndex) => (
                                        <TableCell 
                                            key={`cell-${rowIndex}-${colIndex}`}
                                            className={column.className}
                                        >
                                            {column.cell 
                                                ? column.cell(item, rowIndex)
                                                : column.accessorKey 
                                                    ? item[column.accessorKey] 
                                                    : null}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            renderEmptyState()
                        )}
                    </TableBody>
                )}
            </Table>
        </div>
    )
}
TableWrapper.displayName = 'TableWrapper'

export {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption,
    TableWrapper,
}
