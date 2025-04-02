import { useState, useEffect } from 'react';

/**
 * Hook để debounce giá trị, hữu ích cho việc tìm kiếm và các thao tác cần trì hoãn
 * @param value Giá trị cần debounce
 * @param delay Thời gian trì hoãn tính bằng milliseconds
 * @returns Giá trị đã được debounce
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Tạo timeout để cập nhật giá trị debounced sau khoảng thời gian delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Xóa timeout nếu giá trị thay đổi hoặc component unmount
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
} 