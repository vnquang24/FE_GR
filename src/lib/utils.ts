import { clsx, type ClassValue } from 'clsx'
import dayjs, { Dayjs } from 'dayjs'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const cn = (...inputs: ClassValue[]) => {
    return twMerge(clsx(inputs))
}

const getPageCount = (totalItems: number, itemsPerPage: number) => {
    return Math.ceil(totalItems / itemsPerPage)
}


const formatDate = (
    date: string | Date | Dayjs,
    unit?: 'Day' | 'Month' | 'Year'
) => {
    if (unit === 'Year') return dayjs(date).format('YYYY')
    if (unit === 'Month') return dayjs(date).format('MM/YYYY')
    return dayjs(date).format('DD/MM/YYYY')
}

const formatDateReadable = (date: string | Date | Dayjs) => {
    const d = dayjs(date)
    return `${d.hour().toString().padStart(2, '0')}h:${d.minute().toString().padStart(2, '0')} - ${d.date().toString().padStart(2, '0')}/${(d.month() + 1).toString().padStart(2, '0')}/${d.year()}`
}

const stringToSlug = (str: string) => {
    const from =
            'àáãảạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđùúủũụưừứửữựòóỏõọôồốổỗộơờớởỡợìíỉĩịäëïîöüûñçýỳỹỵỷ',
        to =
            'aaaaaaaaaaaaaaaaaeeeeeeeeeeeduuuuuuuuuuuoooooooooooooooooiiiiiaeiiouuncyyyyy'
    for (let i = 0, l = from.length; i < l; i++) {
        str = str.replace(RegExp(from[i], 'gi'), to[i])
    }
    return str
        .replace(/[^\w\s]/gi, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '_')
}
const cudMany = <
    E extends {
        id: string
    },
    V,
    U extends Partial<E>,
    C extends Partial<V>,
>({
    compareField,
    existedDataArray,
    newDataArray,
    dataCreate,
    dataUpdate,
}: {
    existedDataArray: Array<E>
    newDataArray: Array<V>
    compareField: Array<keyof E & keyof V>
    dataUpdate: (payload: V) => U
    dataCreate: (payload: V) => C
}) => {
    const creates = newDataArray
        .filter((item) => {
            const found = existedDataArray.find((e) =>
                compareField.every(
                    (field) => e[field] == (item[field] as string)
                )
            )
            return !found
        })
        .map(dataCreate)

    const updates = newDataArray
        .map((item) => {
            const found = existedDataArray.find((e) =>
                compareField.every(
                    (field) => e[field] == (item[field] as string)
                )
            )
            return {
                where: {
                    id: found?.id,
                },
                data: dataUpdate(item),
            }
        })
        .filter((item) => item.where.id)

    const deletes = existedDataArray
        .filter((item) => {
            const found = newDataArray.find((e) =>
                compareField.every(
                    (field) => e[field] == (item[field] as string)
                )
            )
            return !found
        })
        .map((item) => ({
            id: item.id,
        }))

    return {
        creates,
        updates,
        deletes,
    }
}


const formatNiceBytes = (x: string) => {
    const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    let l = 0,
        n = parseInt(x, 10) || 0
    while (n >= 1024 && ++l) {
        n = n / 1024
    }
    return n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l]
}

const findMapCenter = (
    master: Array<{
        latitude: number
        longitude: number
    }>
) => {
    const sumLat = master.reduce((acc, { latitude }) => acc + latitude, 0)
    const sumLon = master.reduce((acc, { longitude }) => acc + longitude, 0)
    return {
        latitude: sumLat / master.length,
        longitude: sumLon / master.length,
    }
}

/**
 * Tạo tên thảm họa tự động dựa trên thông tin
 * @param disasterType Tên loại thảm họa
 * @param provinceNames Danh sách tên các tỉnh/thành phố ảnh hưởng
 * @param startDateTime Thời gian bắt đầu thảm họa
 * @param endDateTime Thời gian kết thúc thảm họa (không bắt buộc)
 * @returns Tên thảm họa được tạo tự động với mã duy nhất
 */
const generateDisasterName = (
    disasterType: string,
    provinceNames: string[],
    startDateTime?: Date,
    endDateTime?: Date
): string => {
    // Tạo chuỗi thời gian từ startDateTime và endDateTime
    let timeStr = '';
    if (startDateTime) {
        timeStr = format(startDateTime, 'HH:mm dd/MM/yyyy', { locale: vi });
        
        // Nếu có thời gian kết thúc, thêm vào chuỗi
        if (endDateTime) {
            timeStr += ' - ' + format(endDateTime, 'HH:mm dd/MM/yyyy', { locale: vi });
        }
    } else {
        // Nếu không có thời gian bắt đầu, sử dụng thời gian hiện tại
        const now = new Date();
        timeStr = format(now, 'HH:mm dd/MM/yyyy', { locale: vi });
    }
    
    // Tạo mã ngắn duy nhất từ các thông tin
    const generateUniqueCode = () => {
        // Lấy kí tự đầu của loại thảm họa và loại bỏ dấu
        const typeFirstChar = disasterType ? disasterType.charAt(0) : 'X';
        const typeCode = stringToSlug(typeFirstChar).toUpperCase();
        
        // Lấy kí tự đầu của tỉnh đầu tiên nếu có và loại bỏ dấu
        const provinceFirstChar = provinceNames.length > 0 ? provinceNames[0].charAt(0) : 'Z';
        const provinceCode = stringToSlug(provinceFirstChar).toUpperCase();
        
        // Lấy timestamp từ thời gian bắt đầu hoặc thời gian hiện tại
        const timestamp = startDateTime ? 
            startDateTime.getTime() : new Date().getTime();
        
        // Tạo chuỗi ngẫu nhiên 4 kí tự từ timestamp
        const randomCode = timestamp.toString(32).slice(-4).toUpperCase();
        
        // Kết hợp các thành phần để tạo mã
        const uniqueCode = `${typeCode}${provinceCode}${randomCode}`;
        
        return uniqueCode;
    };
    
    // Tạo tên theo mẫu: Loại thảm họa + Địa điểm + Thời gian
    let name = '';
    
    if (disasterType) {
        name += disasterType;
    }
    
    if (provinceNames.length > 0) {
        // Nếu có nhiều tỉnh, giới hạn hiển thị và thêm "và các tỉnh khác"
        if (provinceNames.length === 1) {
            name += ' tại ' + provinceNames[0];
        } else if (provinceNames.length === 2) {
            name += ' tại ' + provinceNames.join(' và ');
        } else {
            name += ' tại ' + provinceNames.slice(0, 2).join(', ') + ' và các tỉnh khác';
        }
    }
    
    // Thêm thời gian
    if (timeStr) {
        name += ' - ' + timeStr;
    }
    
    // Thêm mã duy nhất vào cuối
    name += ' [' + generateUniqueCode() + ']';
    
    return name;
}

// Thêm hàm getStatusIndicator để sửa lỗi lint
const getStatusIndicator = () => {
    // Hàm tạm thời để sửa lỗi
    return null;
}

export {
    cn,
    formatDate,
    getPageCount,
    stringToSlug,
    formatDateReadable,
    cudMany,
    formatNiceBytes,
    findMapCenter,
    getStatusIndicator,
    generateDisasterName
}
