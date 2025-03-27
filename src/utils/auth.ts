import { setCookie, getCookie, deleteCookie } from 'cookies-next';
import { fetchAuthControllerLogin, fetchAuthControllerRegister, fetchAuthControllerLogout } from '@/generated/api/chcnComponents';
import { jwtDecode } from 'jwt-decode';
import ms from 'ms'; // Thêm import này


// Interface cho JWT payload
interface JwtPayload {
  sub: string;       // email
  userId: string;    // userId
  iat: number;       // thời điểm phát hành token
  exp: number;       // thời điểm hết hạn token
}

// Hàm chuyển đổi chuỗi thời gian JWT thành giây
const parseJwtExpiresIn = (expiresIn: string): number => {
  try {
    console.log(ms(expiresIn as ms.StringValue) / 1000);
    // Chuyển đổi từ định dạng như "1m", "1d" sang milliseconds, sau đó chia cho 1000 để có giây
    return ms(expiresIn as ms.StringValue) / 1000;
  } catch (error) {
    console.error('Error parsing JWT expires time:', error);
    return 60 * 15;
  }
};

// Lấy thời gian hết hạn từ biến môi trường
const JWT_EXPIRES_IN = process.env.NEXT_PUBLIC_JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.NEXT_PUBLIC_JWT_REFRESH_EXPIRES_IN || '30d';

// Chuyển đổi thành giây để sử dụng trong maxAge của cookie
const accessTokenMaxAge = parseJwtExpiresIn(JWT_EXPIRES_IN) + 10;
const refreshTokenMaxAge = parseJwtExpiresIn(JWT_REFRESH_EXPIRES_IN) + 10;

/**
 * Lấy user ID từ access token
 * @returns User ID hoặc null nếu không có token hợp lệ
 */
export const getUserId = (): string | null => {
  try {
    const accessToken = getCookie('accessToken') as string | undefined;
    if (!accessToken) return null;

    const decoded = jwtDecode<JwtPayload>(accessToken);
    console.log(decoded);
    return decoded.userId || null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

/**
 * Kiểm tra xem token có còn hạn hay không
 * @returns true nếu token còn hạn, false nếu hết hạn hoặc không có token
 */
export const isTokenValid = (): boolean => {
  try {
    const accessToken = getCookie('accessToken') as string | undefined;
    if (!accessToken) return false;

    const decoded = jwtDecode<JwtPayload>(accessToken);
    if (!decoded || !decoded.exp) return false;
    console.log(decoded);
    // So sánh thời gian hết hạn với thời gian hiện tại (tính bằng giây)
    const currentTime = Math.floor(Date.now() / 1000);
    console.log(currentTime);
    return decoded.exp > currentTime;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

/**
 * Đăng ký tài khoản mới
 */
export const register = async (email: string, password: string, name: string, phone: string): Promise<boolean> => {
  try {
    const response = await fetchAuthControllerRegister({
      body: {
        email,
        password,
        phone,
        name
      }
    });
    console.log(response);
    if (response && response.accessToken && response.refreshToken) {
      // Lưu tokens
      setCookie('accessToken', response.accessToken, {
        maxAge: accessTokenMaxAge,
        path: '/',
      });

      setCookie('refreshToken', response.refreshToken, {
        maxAge: refreshTokenMaxAge,
        path: '/',
      });

      return true;
    }

    return false;
  } catch (err) {
    console.error('Register error:', err);
    return false;
  }
};

/**
 * Đăng nhập vào hệ thống
 */
export const login = async (email: string, password: string): Promise<boolean> => {
  try {
    const data = await fetchAuthControllerLogin({
      body: {
        email,
        password,
      }
    });
    if (data && data.accessToken && data.refreshToken) {
      // Lưu tokens
      setCookie('accessToken', data.accessToken, {
        maxAge: accessTokenMaxAge,
        path: '/',
      });
      setCookie('refreshToken', data.refreshToken, {
        maxAge: refreshTokenMaxAge,
        path: '/',
      });
      console.log(isTokenValid());
      return true;
    }

    return false;
  } catch (err) {
    console.error('Authentication error:', err);
    return false;
  }
};

/**
 * Lấy thông tin người dùng từ token
 * @returns Thông tin từ payload của token hoặc null nếu không có token hợp lệ
 */
export const getUserInfo = (): Partial<JwtPayload> | null => {
  try {
    const accessToken = getCookie('accessToken') as string | undefined;
    if (!accessToken) return null;

    return jwtDecode<JwtPayload>(accessToken);
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
};

/**
 * Đăng xuất khỏi hệ thống
 */
export const logout = async (): Promise<void> => {
  deleteCookie('accessToken', { path: '/' });
  const refreshToken = getCookie('refreshToken') as string | undefined;
  if (refreshToken) {
    await fetchAuthControllerLogout({
      body: {
        refreshToken,
      },
    });
  }
  deleteCookie('refreshToken', { path: '/' });

}