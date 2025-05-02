import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

interface TooltipWrapperProps {
    children: React.ReactNode | React.ReactNode[]
    description?: string
    delayDuration?: number
    side?: 'top' | 'right' | 'bottom' | 'left'
    align?: 'start' | 'center' | 'end'
    alignOffset?: number
    className?: string
}

const TooltipWrapper = ({
    align = 'start',
    className = 'max-w-[200px]',
    delayDuration = 100,
    alignOffset = 2,
    side = 'right',
    children,
    description,
}: TooltipWrapperProps) => {
    return (
        <TooltipProvider disableHoverableContent>
            <Tooltip delayDuration={delayDuration}>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                {description && (
                    <TooltipContent
                        side={side}
                        align={align}
                        alignOffset={alignOffset}
                        className={className}
                    >
                        {description}
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    )
}

export default TooltipWrapper
