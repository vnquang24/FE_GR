import { $Enums } from '@prisma/client'
import ability from './ability'

const useAbility = () => {
    return {
        can: (action: $Enums.PermissionType, subject: $Enums.PermissionName) =>
            ability.can(action, subject),
        cannot: (
            action: $Enums.PermissionType,
            subject: $Enums.PermissionName
        ) => ability.cannot(action, subject),
    }
}

export { useAbility }
