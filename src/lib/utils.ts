import { clsx, type ClassValue } from 'clsx'
import { deleteCookie, getCookies } from 'cookies-next'
import dayjs, { Dayjs } from 'dayjs'
import { twMerge } from 'tailwind-merge'

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



const arrayToObject = <T extends Record<string, any>>(
    arr: Array<T>,
    key: keyof T,
    mapFn?: (item: T, currentIndex: number, currentArray: Array<T>) => any
) => {
    return arr.reduce(
        (payload, item, currentIndex, currentArr) => {
            payload[item[key]] = mapFn
                ? mapFn(item, currentIndex, currentArr)
                : item
            return payload
        },
        {} as Record<string, any>
    )
}

const arrayRemoveDuplicates = <T extends Record<string, any>>(
    arr: Array<T>,
    mapFn: (item: T, currentIndex: number, currentArray: Array<T>) => any
) => {
    return [...new Set(arr.map(mapFn).flat())]
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

export {
    cn,
    formatDate,
    getPageCount,
    stringToSlug,
    formatDateReadable,
    cudMany,
    arrayToObject,
    arrayRemoveDuplicates,
    formatNiceBytes,
    findMapCenter,
}
