import { $Enums } from '@prisma/client'
import { useAbility } from './hooks'
type CanProps = {
    children: React.ReactNode
    I: $Enums.PermissionType
    a: $Enums.PermissionName
}

const Can = ({ children, I, a }: CanProps) => {
    const { can } = useAbility()
    if (!can(I, a)) {
        return null
    }
    return children
}

export { Can }
