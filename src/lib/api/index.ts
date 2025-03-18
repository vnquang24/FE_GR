import { QueryClient } from '@tanstack/react-query'
import { FetchFn } from '@zenstackhq/tanstack-query/runtime-v5'
import { getAccessToken } from '@/utils/auth'
const queryClient = new QueryClient()


const fetchInstance: FetchFn = (url, options) => {
    const accessToken = getAccessToken();
    console.log('accessToken', accessToken)
    options = options ?? {}
    options.headers = {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
    }
    return fetch(url, options).then(async (res) => {
        console.log('res', res)
        return res
    })
}
export { fetchInstance, queryClient }
