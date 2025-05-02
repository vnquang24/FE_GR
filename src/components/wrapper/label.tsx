import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

type LabelWrapperProps = {
    children: ReactNode | ReactNode[]
    label?: string
    className?: string
}

const LabelWrapper = ({ label, children, className }: LabelWrapperProps) => {
    return (
        <div className="flex flex-col gap-2">
            <Label className="text-primary">{label}</Label>
            <div className={cn('flex flex-row gap-2', className)}>
                {children}
            </div>
        </div>
    )
}
export default LabelWrapper
