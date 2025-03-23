import { QueryClient } from '@tanstack/react-query'
import { FetchFn } from '@zenstackhq/tanstack-query/runtime-v5'
import { HttpStatusCode } from 'axios'
import { fetchAuthControllerRefreshToken } from '@/generated/api/chcnComponents'
import { getCookie, setCookie } from 'cookies-next'
import { logout } from '@/utils/auth'
import { toast } from "@/components/ui/toast"; 

const queryClient = new QueryClient()
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL
const AUTH_URL = ['auth/login', 'auth/logout', 'auth/refresh-token']
const interceptorsResponse = async (status: number, url: string) => {
    if (
        (status == HttpStatusCode.Unauthorized ||
            status == HttpStatusCode.Forbidden) &&
        AUTH_URL.every((item) => !url.includes(item))
    ) {
        try {
            const refreshToken = String(getCookie('refreshToken')) || ''
            if (!refreshToken) {
                throw new Error('Refresh token is undefined')
            }
            const resRefresh = await fetchAuthControllerRefreshToken({
                body: {
                    refreshToken,
                },
            })
            if (resRefresh.accessToken) {
                setCookie('accessToken', resRefresh.accessToken)
            } else {
                throw new Error('Access token is undefined');
            }
        } catch (error) {
            console.error('[RefreshToken]', error)
            toast.error({
                title: "Phiên làm việc hết hạn",
                description: "Vui lòng đăng nhập lại để tiếp tục.",
                position: "top-right",
                autoClose: 2000, // Hiển thị trong 2 giây
              });
            logout();
            if (typeof window !== 'undefined') {
                setTimeout(() => {
                  window.location.href = '/auth/login';
                }, 2000);
              }
        }
    }
}

const fetchInstance: FetchFn = (url, options) => {
    const accessToken = getCookie('accessToken') as string
    options = options ?? {}
    options.headers = {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
    }
    return fetch(url, options).then(async (res) => {
        await interceptorsResponse(res.status, res.url)
        return res
    })
}
export { BASE_URL, fetchInstance, queryClient, interceptorsResponse }
