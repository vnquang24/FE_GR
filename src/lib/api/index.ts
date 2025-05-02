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

// Cờ toàn cục để đảm bảo quản lý refresh và logout hiệu quả
let isRefreshing = false;
let isLoggingOut = false;
let refreshRetryCount = 0;
const MAX_REFRESH_RETRIES = 3;

// Promise để xử lý nhiều requests đồng thời
let refreshTokenPromise: Promise<string | null> | null = null;

// Xử lý khi status code trả về là 401 hoặc 403
const interceptorsResponse = async (status: number, url: string, options?: any) => {
    console.log(`🔄 [Auth] Nhận được status code ${status} từ URL: ${url}`);
    
    if (
        (status == HttpStatusCode.Unauthorized ||
            status == HttpStatusCode.Forbidden) &&
        AUTH_URL.every((item) => !url.includes(item))
    ) {
        console.log(`🔑 [Auth] Phát hiện lỗi xác thực, URL không phải auth URL`);
        console.log(`🚥 [Auth] Trạng thái: isRefreshing=${isRefreshing}, isLoggingOut=${isLoggingOut}, refreshRetryCount=${refreshRetryCount}`);
        
        // Nếu đang trong quá trình đăng xuất, không làm gì
        if (isLoggingOut) {
            console.log(`🚫 [Auth] Đang đăng xuất, bỏ qua refresh token`);
            return;
        }

        try {
            // Kiểm tra số lần thử refresh
            if (refreshRetryCount >= MAX_REFRESH_RETRIES) {
                console.log(`⚠️ [Auth] Đã vượt quá số lần thử (${refreshRetryCount}/${MAX_REFRESH_RETRIES})`);
                throw new Error('Đã vượt quá số lần thử refresh token');
            }

            // Nếu đang refresh, sử dụng promise hiện tại
            if (!refreshTokenPromise) {
                console.log(`🆕 [Auth] Tạo mới Promise refresh token`);
                // Tạo promise mới chỉ khi chưa có
                refreshTokenPromise = refreshToken();
            } else {
                console.log(`⏳ [Auth] Đang chờ Promise refresh token hiện tại`);
            }

            // Đợi kết quả refresh token
            console.log(`⌛ [Auth] Đang đợi kết quả refresh token...`);
            const newToken = await refreshTokenPromise;
            console.log(`✅ [Auth] Đã nhận được kết quả refresh token: ${newToken ? 'Thành công' : 'Thất bại'}`);
            
            // Nếu refresh thành công và có options, thử lại request
            if (newToken && options) {
                console.log(`🔄 [Auth] Thử lại request với token mới`);
                // Cập nhật token trong options và thử lại request
                const retryOptions = {
                    ...options,
                    headers: {
                        ...options.headers,
                        Authorization: `Bearer ${newToken}`,
                    }
                };
                console.log(`🔄 [Auth] Headers mới:`, retryOptions.headers);
                
                return fetch(url, retryOptions);
            }
            
            // Nếu không có token mới, xử lý lỗi
            if (!newToken) {
                console.log(`❌ [Auth] Không thể lấy token mới`);
                throw new Error('Không thể refresh token');
            }
        } catch (error) {
            console.error(`❌ [Auth] Lỗi refresh token:`, error);
            
            // Xử lý lỗi và đăng xuất nếu cần
            handleAuthError();
        }
    } else if (status === HttpStatusCode.Unauthorized || status === HttpStatusCode.Forbidden) {
        console.log(`ℹ️ [Auth] Bỏ qua xử lý cho URL auth: ${url}`);
    }
}

// Hàm riêng để refresh token
const refreshToken = async (): Promise<string | null> => {
    try {
        // Đánh dấu đang refresh và tăng số lần thử
        isRefreshing = true;
        refreshRetryCount++;

        console.log(`🔄 [RefreshToken] Bắt đầu refresh lần ${refreshRetryCount}/${MAX_REFRESH_RETRIES}`);

        const refreshToken = String(getCookie('refreshToken')) || '';
        if (!refreshToken) {
            console.log(`❌ [RefreshToken] Không tìm thấy refresh token trong cookie`);
            throw new Error('Refresh token không tồn tại');
        }
        
        console.log(`📤 [RefreshToken] Gửi request refresh token đến server`);
        const resRefresh = await fetchAuthControllerRefreshToken({
            body: {
                refreshToken,
            },
        });
        
        console.log(`📥 [RefreshToken] Phản hồi từ server:`, resRefresh);
        
        if (resRefresh.accessToken) {
            // Refresh thành công
            setCookie('accessToken', resRefresh.accessToken);
            console.log(`✅ [RefreshToken] Đã lưu access token mới vào cookie`);
            console.log('📦 [RefreshToken] Access token mới:', resRefresh.refreshToken);
            setCookie('refreshToken', resRefresh.refreshToken);
            // Đặt lại cờ và bộ đếm
            isRefreshing = false;
            refreshRetryCount = 0;
            
            // Đặt lại promise
            setTimeout(() => {
                refreshTokenPromise = null;
                console.log(`🧹 [RefreshToken] Đã xóa Promise để sẵn sàng cho lần sau`);
            }, 100);
            
            return resRefresh.accessToken;
        } else {
            console.log(`⚠️ [RefreshToken] Server trả về nhưng không có access token`);
            throw new Error('Access token không hợp lệ');
        }
    } catch (error) {
        console.error(`❌ [RefreshToken] Lỗi:`, error);
        
        // Đặt lại promise để lần sau có thể thử lại
        refreshTokenPromise = null;
        isRefreshing = false;
        
        // Quăng lỗi để xử lý ở trên
        throw error;
    }
};

// Hàm xử lý lỗi xác thực
const handleAuthError = () => {
    console.log(`🚨 [AuthError] Xử lý lỗi xác thực, refreshRetryCount=${refreshRetryCount}`);
    
    // Chỉ đăng xuất nếu đã hết lượt thử
    if (refreshRetryCount >= MAX_REFRESH_RETRIES) {
        console.log(`🔑 [AuthError] Đã vượt quá số lần thử, chuẩn bị đăng xuất`);
        
        // Đặt lại các cờ và bộ đếm
        isRefreshing = false;
        refreshRetryCount = 0;
        refreshTokenPromise = null;
        
        // Đánh dấu đang đăng xuất để tránh các yêu cầu làm mới lại
        isLoggingOut = true;

        // Hiển thị toast và đợi nó biến mất
        if (typeof window !== 'undefined') {
            console.log(`🔔 [AuthError] Hiển thị thông báo cho người dùng`);
            
            toast.error({
                title: "Phiên làm việc hết hạn",
                description: "Vui lòng đăng nhập lại để tiếp tục.",
                position: "top-center",
                autoClose: 3000,
                onClose: () => {
                    console.log(`👋 [AuthError] Toast đã đóng, tiến hành đăng xuất`);
                    // Đăng xuất sau khi toast biến mất
                    logout().then(() => {
                        console.log(`🚪 [AuthError] Đăng xuất thành công, chuyển hướng đến trang đăng nhập`);
                        window.location.href = '/auth/login';
                        isLoggingOut = false;
                    });
                }
            });

            // Fallback nếu onClose không hoạt động
            setTimeout(() => {
                if (isLoggingOut) {
                    console.log(`⏱️ [AuthError] Fallback timeout kích hoạt`);
                    logout().then(() => {
                        window.location.href = '/auth/login';
                        isLoggingOut = false;
                    });
                }
            }, 3500);
        }
    } else {
        console.log(`⚠️ [AuthError] Vẫn còn cơ hội thử lại (${refreshRetryCount}/${MAX_REFRESH_RETRIES})`);
    }
};

const fetchInstance: FetchFn = (url, options) => {
    const accessToken = getCookie('accessToken') as string
    options = options ?? {}
    options.headers = {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
    }
    
    console.log(`🔄 [Fetch] Gửi request đến: ${url}`);
    
    return fetch(url, options).then(async (res) => {
        console.log(`📥 [Fetch] Nhận response từ ${url}, status: ${res.status}`);
        
        if (!res.ok) {
            console.log(`⚠️ [Fetch] Response không OK, status: ${res.status}`);
            // Xử lý lỗi xác thực
            const result = await interceptorsResponse(res.status, res.url, options);
            console.log(`🔄 [Fetch] Kết quả từ interceptorsResponse:`, result);
            // Nếu có kết quả từ việc thử lại, trả về kết quả đó
            if (result) {
                console.log(`✅ [Fetch] Đã thử lại request thành công`);
                return result;
            }
            console.log(`➡️ [Fetch] Trả về response ban đầu vì không thể thử lại`);
        }
        return res
    })
}
export { BASE_URL, fetchInstance, queryClient, interceptorsResponse }
