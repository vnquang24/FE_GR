import { setCookie, getCookie, deleteCookie } from 'cookies-next';
import { fetchAuthControllerLogin, fetchAuthControllerRegister, fetchAuthControllerLogout, fetchAuthControllerCheckValidToken } from '@/generated/api/chcnComponents';
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
    console.log("Đây là khoảng thời gian  convert", ms(expiresIn as ms.StringValue) / 1000);
    // Chuyển đổi từ định dạng như "1m", "1d" sang milliseconds, sau đó chia cho 1000 để có giây
    return ms(expiresIn as ms.StringValue) / 1000;
  } catch (error) {
    console.error('Error parsing JWT expires time:', error);
    return 60 * 15;
  }
};

// Lấy thời gian hết hạn từ biến môi trường
const JWT_EXPIRES_IN = process.env.NEXT_PUBLIC_JWT_EXPIRES_IN || '60m';
const JWT_REFRESH_EXPIRES_IN = process.env.NEXT_PUBLIC_JWT_REFRESH_EXPIRES_IN || '7d';

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

export const validateTokenWithServer = async (): Promise<boolean> => {
  try {
    const accessToken = getCookie('accessToken') as string;
    if (!accessToken) return false;

    const response = await fetchAuthControllerCheckValidToken({
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });

    if (!response) {
      console.error('No response from server');
      return false;
    } else {
      console.log("Đây là response từ hàm validate", response.isValid);
      return response.isValid || false;
    }
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};
/**
 * Kiểm tra xem token có còn hạn hay không
 * @returns true nếu token còn hạn, false nếu hết hạn hoặc không có token
 */
export const isTokenValid = async (): Promise<boolean> => {
  try {
    // 1. Kiểm tra nhanh ở local
    const accessToken = getCookie('accessToken') as string;
    if (!accessToken) return false;

    const decoded = jwtDecode<JwtPayload>(accessToken);
    const currentTime = Math.floor(Date.now() / 1000);

    // Nếu token đã hết hạn, không cần kiểm tra server
    if (decoded.exp <= currentTime) return false;

    // 2. Kiểm tra với server (có thể cache kết quả trong session storage)
    const lastValidated = sessionStorage.getItem('lastTokenValidation');
    const now = Date.now();

    // Chỉ kiểm tra với server mỗi phút/request quan trọng
    if (!lastValidated || now - parseInt(lastValidated) > 60000) {
      const isValid = await validateTokenWithServer();
      if (isValid) {
        sessionStorage.setItem('lastTokenValidation', now.toString());
      }
      return isValid;
    }

    return true;
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
    console.log("Thời gian tồn tại của access token:", accessTokenMaxAge);
    console.log("Thời gian tồn tại của refresh token:", refreshTokenMaxAge);
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
    
    console.log("Thời gian tồn tại của access token:", accessTokenMaxAge);
    console.log("Thời gian tồn tại của refresh token:", refreshTokenMaxAge);
    if (data && data.accessToken && data.refreshToken) {
        console.log("Đây là access token", data.accessToken);
        console.log("Đây là refresh token", data.refreshToken);
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