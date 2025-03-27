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
// Xử lý khi status code trả về là 401 hoặc 403
// Cờ toàn cục để đảm bảo chỉ hiển thị một thông báo lỗi
let isRefreshing = false;
let isLoggingOut = false;

// Xử lý khi status code trả về là 401 hoặc 403
const interceptorsResponse = async (status: number, url: string) => {
    if (
        (status == HttpStatusCode.Unauthorized ||
            status == HttpStatusCode.Forbidden) &&
        AUTH_URL.every((item) => !url.includes(item))
    ) {
        // Nếu đang trong quá trình refresh hoặc đăng xuất, không làm gì
        if (isRefreshing || isLoggingOut) return;

        try {
            // Đánh dấu đang refresh
            isRefreshing = true;

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
                // Refresh thành công, đặt lại cờ
                isRefreshing = false;
            } else {
                throw new Error('Access token is undefined');
            }
        } catch (error) {
            console.error('[RefreshToken]', error)

            // Hiển thị toast và đợi nó biến mất
            const showToastAndWait = () => {
                return new Promise<void>(resolve => {
                    toast.error({
                        title: "Phiên làm việc hết hạn",
                        description: "Vui lòng đăng nhập lại để tiếp tục.",
                        position: "top-center",
                        autoClose: 2000,
                        // Nếu toast có callback onClose, bạn có thể dùng nó thay vì setTimeout
                        onClose: () => {
                            resolve();
                        }
                    });

                    // Fallback nếu onClose không hoạt động
                    setTimeout(resolve, 2200); // Thêm 200ms để đảm bảo
                });
            };

            // Thực hiện tuần tự: hiển thị toast -> đăng xuất -> chuyển trang
            if (typeof window !== 'undefined') {
                showToastAndWait()
                    .then(() => {
                        // Đăng xuất sau khi toast biến mất
                        logout();
                    })
                    .then(() => {
                        // Chuyển trang sau khi đăng xuất
                        window.location.href = '/auth/login';
                    });
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
