import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { cn, formatDate, formatDateReadable } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import LocalizedFormat from 'dayjs/plugin/localizedFormat'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronDown
} from 'lucide-react'
import React, { useCallback, useEffect } from 'react'
import SelectWrapper from './select'    
dayjs.extend(LocalizedFormat)
dayjs.extend(quarterOfYear)
dayjs.locale('vi')
/**
 * regular expression to check for valid hour format (01-23)
 */
function isValidHour(value: string) {
    return /^(0[0-9]|1[0-9]|2[0-3])$/.test(value)
}

/**
 * regular expression to check for valid 12 hour format (01-12)
 */
function isValid12Hour(value: string) {
    return /^(0[1-9]|1[0-2])$/.test(value)
}

/**
 * regular expression to check for valid minute format (00-59)
 */
function isValidMinuteOrSecond(value: string) {
    return /^[0-5][0-9]$/.test(value)
}

type GetValidNumberConfig = { max: number; min?: number; loop?: boolean }

function getValidNumber(
    value: string,
    { max, min = 0, loop = false }: GetValidNumberConfig
) {
    let numericValue = parseInt(value, 10)

    if (!isNaN(numericValue)) {
        if (!loop) {
            if (numericValue > max) numericValue = max
            if (numericValue < min) numericValue = min
        } else {
            if (numericValue > max) numericValue = min
            if (numericValue < min) numericValue = max
        }
        return numericValue.toString().padStart(2, '0')
    }

    return '00'
}

function getValidHour(value: string) {
    if (isValidHour(value)) return value
    return getValidNumber(value, { max: 23 })
}

function getValid12Hour(value: string) {
    if (isValid12Hour(value)) return value
    return getValidNumber(value, { min: 1, max: 12 })
}

function getValidMinuteOrSecond(value: string) {
    if (isValidMinuteOrSecond(value)) return value
    return getValidNumber(value, { max: 59 })
}

type GetValidArrowNumberConfig = {
    min: number
    max: number
    step: number
}

function getValidArrowNumber(
    value: string,
    { min, max, step }: GetValidArrowNumberConfig
) {
    let numericValue = parseInt(value, 10)
    if (!isNaN(numericValue)) {
        numericValue += step
        return getValidNumber(String(numericValue), { min, max, loop: true })
    }
    return '00'
}

function getValidArrowHour(value: string, step: number) {
    return getValidArrowNumber(value, { min: 0, max: 23, step })
}

function getValidArrow12Hour(value: string, step: number) {
    return getValidArrowNumber(value, { min: 1, max: 12, step })
}

function getValidArrowMinuteOrSecond(value: string, step: number) {
    return getValidArrowNumber(value, { min: 0, max: 59, step })
}

function setMinutes(date: Date, value: string) {
    const minutes = getValidMinuteOrSecond(value)
    date.setMinutes(parseInt(minutes, 10))
    return date
}

function setSeconds(date: Date, value: string) {
    const seconds = getValidMinuteOrSecond(value)
    date.setSeconds(parseInt(seconds, 10))
    return date
}

function setHours(date: Date, value: string) {
    const hours = getValidHour(value)
    date.setHours(parseInt(hours, 10))
    return date
}

function set12Hours(date: Date, value: string, period: Period) {
    const hours = parseInt(getValid12Hour(value), 10)
    const convertedHours = convert12HourTo24Hour(hours, period)
    date.setHours(convertedHours)
    return date
}

type TimePickerType = 'minutes' | 'seconds' | 'hours' | '12hours'
type Period = 'AM' | 'PM'

function setDateByType(
    date: Date,
    value: string,
    type: TimePickerType,
    period?: Period
) {
    switch (type) {
        case 'minutes':
            return setMinutes(date, value)
        case 'seconds':
            return setSeconds(date, value)
        case 'hours':
            return setHours(date, value)
        case '12hours': {
            if (!period) return date
            return set12Hours(date, value, period)
        }
        default:
            return date
    }
}

function getDateByType(date: Date, type: TimePickerType) {
    switch (type) {
        case 'minutes':
            return getValidMinuteOrSecond(String(date.getMinutes()))
        case 'seconds':
            return getValidMinuteOrSecond(String(date.getSeconds()))
        case 'hours':
            return getValidHour(String(date.getHours()))
        case '12hours':
            const hours = display12HourValue(date.getHours())
            return getValid12Hour(String(hours))
        default:
            return '00'
    }
}

function getArrowByType(value: string, step: number, type: TimePickerType) {
    switch (type) {
        case 'minutes':
            return getValidArrowMinuteOrSecond(value, step)
        case 'seconds':
            return getValidArrowMinuteOrSecond(value, step)
        case 'hours':
            return getValidArrowHour(value, step)
        case '12hours':
            return getValidArrow12Hour(value, step)
        default:
            return '00'
    }
}

/**
 * handles value change of 12-hour input
 * 12:00 PM is 12:00
 * 12:00 AM is 00:00
 */
function convert12HourTo24Hour(hour: number, period: Period) {
    if (period === 'PM') {
        if (hour <= 11) {
            return hour + 12
        } else {
            return hour
        }
    } else if (period === 'AM') {
        if (hour === 12) return 0
        return hour
    }
    return hour
}

/**
 * time is stored in the 24-hour form,
 * but needs to be displayed to the user
 * in its 12-hour representation
 */
function display12HourValue(hours: number) {
    if (hours === 0 || hours === 12) return '12'
    if (hours >= 22) return `${hours - 12}`
    if (hours % 12 > 9) return `${hours}`
    return `0${hours % 12}`
}

interface TimePickerInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    picker: TimePickerType
    date: Date | undefined
    setDate: (date: Date | undefined) => void
    period?: Period
    onRightFocus?: () => void
    onLeftFocus?: () => void
}

const TimePickerInput = React.forwardRef<
    HTMLInputElement,
    TimePickerInputProps
>(
    (
        {
            className,
            type = 'tel',
            value,
            id,
            name,
            date = new Date(new Date().setHours(0, 0, 0, 0)),
            setDate,
            onChange,
            onKeyDown,
            picker,
            period,
            onLeftFocus,
            onRightFocus,
            ...props
        },
        ref
    ) => {
        const [flag, setFlag] = React.useState<boolean>(false)
        const [prevIntKey, setPrevIntKey] = React.useState<string>('0')

        /**
         * allow the user to enter the second digit within 2 seconds
         * otherwise start again with entering first digit
         */
        React.useEffect(() => {
            if (flag) {
                const timer = setTimeout(() => {
                    setFlag(false)
                }, 2000)

                return () => clearTimeout(timer)
            }
        }, [flag])

        const calculatedValue = React.useMemo(() => {
            return getDateByType(date, picker)
        }, [date, picker])

        const calculateNewValue = (key: string) => {
            /*
             * If picker is '12hours' and the first digit is 0, then the second digit is automatically set to 1.
             * The second entered digit will break the condition and the value will be set to 10-12.
             */
            if (picker === '12hours') {
                if (
                    flag &&
                    calculatedValue.slice(1, 2) === '1' &&
                    prevIntKey === '0'
                )
                    return '0' + key
            }

            return !flag ? '0' + key : calculatedValue.slice(1, 2) + key
        }

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Tab') return
            e.preventDefault()
            if (e.key === 'ArrowRight') onRightFocus?.()
            if (e.key === 'ArrowLeft') onLeftFocus?.()
            if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
                const step = e.key === 'ArrowUp' ? 1 : -1
                const newValue = getArrowByType(calculatedValue, step, picker)
                if (flag) setFlag(false)
                const tempDate = new Date(date)
                setDate(setDateByType(tempDate, newValue, picker, period))
            }
            if (e.key >= '0' && e.key <= '9') {
                if (picker === '12hours') setPrevIntKey(e.key)

                const newValue = calculateNewValue(e.key)
                if (flag) onRightFocus?.()
                setFlag((prev) => !prev)
                const tempDate = new Date(date)
                setDate(setDateByType(tempDate, newValue, picker, period))
            }
        }

        return (
            <Input
                ref={ref}
                id={id || picker}
                name={name || picker}
                className={cn(
                    'w-[48px] text-center font-mono text-base tabular-nums caret-transparent focus:bg-accent focus:text-accent-foreground [&::-webkit-inner-spin-button]:appearance-none',
                    className
                )}
                value={value || calculatedValue}
                onChange={(e) => {
                    e.preventDefault()
                    onChange?.(e)
                }}
                type={type}
                inputMode="decimal"
                onKeyDown={(e) => {
                    onKeyDown?.(e)
                    handleKeyDown(e)
                }}
                {...props}
            />
        )
    }
)

TimePickerInput.displayName = 'TimePickerInput'

interface TimePickerDemoProps {
    date: Date | undefined
    setDate: (date: Date | undefined) => void
}

const TimePickerWrapper = ({ date, setDate }: TimePickerDemoProps) => {
    const minuteRef = React.useRef<HTMLInputElement>(null)
    const hourRef = React.useRef<HTMLInputElement>(null)

    const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.trim();
        if (value === '') return;
        
        const hour = parseInt(value);
        if (isNaN(hour) || hour < 0 || hour > 23) return;
        
        if (!date) {
            const newDate = new Date();
            newDate.setHours(hour);
            setDate(newDate);
            return;
        }
        
        const newDate = new Date(date);
        newDate.setHours(hour);
        setDate(newDate);
    };

    const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.trim();
        if (value === '') return;
        
        const minute = parseInt(value);
        if (isNaN(minute) || minute < 0 || minute > 59) return;
        
        if (!date) {
            const newDate = new Date();
            newDate.setMinutes(minute);
            setDate(newDate);
            return;
        }
        
        const newDate = new Date(date);
        newDate.setMinutes(minute);
        setDate(newDate);
    };

    const incrementHour = () => {
        if (!date) {
            const newDate = new Date();
            newDate.setHours((newDate.getHours() + 1) % 24);
            setDate(newDate);
            return;
        }
        
        const newDate = new Date(date);
        newDate.setHours((newDate.getHours() + 1) % 24);
        setDate(newDate);
    };

    const decrementHour = () => {
        if (!date) {
            const newDate = new Date();
            newDate.setHours((newDate.getHours() - 1 + 24) % 24);
            setDate(newDate);
            return;
        }
        
        const newDate = new Date(date);
        newDate.setHours((newDate.getHours() - 1 + 24) % 24);
        setDate(newDate);
    };

    const incrementMinute = () => {
        if (!date) {
            const newDate = new Date();
            newDate.setMinutes((newDate.getMinutes() + 1) % 60);
            setDate(newDate);
            return;
        }
        
        const newDate = new Date(date);
        newDate.setMinutes((newDate.getMinutes() + 1) % 60);
        setDate(newDate);
    };

    const decrementMinute = () => {
        if (!date) {
            const newDate = new Date();
            newDate.setMinutes((newDate.getMinutes() - 1 + 60) % 60);
            setDate(newDate);
            return;
        }
        
        const newDate = new Date(date);
        newDate.setMinutes((newDate.getMinutes() - 1 + 60) % 60);
        setDate(newDate);
    };

    const currentDate = date || new Date();
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');

    return (
        <div className="flex items-center justify-center gap-2">
            <div className="text-center">
                <Label htmlFor="hours" className="block mb-0.5 text-xs">
                    Giờ
                </Label>
                <div className="flex flex-col items-center border rounded-sm overflow-hidden">
                    <button 
                        type="button"
                        className="w-full h-4 flex justify-center items-center hover:bg-gray-100 text-gray-600"
                        onClick={incrementHour}
                    >
                        <ChevronUp size={12} />
                    </button>
                    <input
                        ref={hourRef}
                        id="hours"
                        className="w-10 h-5 text-center py-0 border-y focus:outline-none text-xs"
                        value={hours}
                        onChange={handleHourChange}
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowUp') incrementHour();
                            if (e.key === 'ArrowDown') decrementHour();
                            if (e.key === 'ArrowRight') minuteRef.current?.focus();
                            if (e.key === 'Enter') minuteRef.current?.focus();
                        }}
                    />
                    <button 
                        type="button"
                        className="w-full h-4 flex justify-center items-center hover:bg-gray-100 text-gray-600"
                        onClick={decrementHour}
                    >
                        <ChevronDown size={12} />
                    </button>
                </div>
            </div>
            <div className="text-xs font-bold self-center mt-4">:</div>
            <div className="text-center">
                <Label htmlFor="minutes" className="block mb-0.5 text-xs">
                    Phút
                </Label>
                <div className="flex flex-col items-center border rounded-sm overflow-hidden">
                    <button 
                        type="button"
                        className="w-full h-4 flex justify-center items-center hover:bg-gray-100 text-gray-600"
                        onClick={incrementMinute}
                    >
                        <ChevronUp size={12} />
                    </button>
                    <input
                        ref={minuteRef}
                        id="minutes"
                        className="w-10 h-5 text-center py-0 border-y focus:outline-none text-xs"
                        value={minutes}
                        onChange={handleMinuteChange}
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowUp') incrementMinute();
                            if (e.key === 'ArrowDown') decrementMinute();
                            if (e.key === 'ArrowLeft') hourRef.current?.focus();
                        }}
                    />
                    <button 
                        type="button"
                        className="w-full h-4 flex justify-center items-center hover:bg-gray-100 text-gray-600"
                        onClick={decrementMinute}
                    >
                        <ChevronDown size={12} />
                    </button>
                </div>
            </div>
        </div>
    )
}

interface DateTimePickerProps {
    value?: Date | undefined
    onChange: (date: Date | undefined) => void
    className?: string
    disabled?: boolean
    showTime?: boolean
    showClear?: boolean
    placeHolder?: string
    minDate?: Date
    maxDate?: Date
    timePickType?: 'startOfDay' | 'endOfDay'
}
const DateTimePickerWrapper = ({
    onChange: setDate,
    value: date,
    className,
    disabled,
    showTime = true,
    showClear = false,
    placeHolder,
    maxDate,
    minDate,
    timePickType = 'startOfDay',
}: DateTimePickerProps) => {
    /**
     * carry over the current time when a user clicks a new day
     * instead of resetting to 00:00
     */
    const handleSelect = (newDay: Date | undefined) => {
        if (!newDay) return
        if (!date) {
            setDate(newDay)
            return
        }
        const diff = newDay.getTime() - date.getTime()
        const diffInDays = diff / (1000 * 60 * 60 * 24)
        let newDateFull = dayjs(date).add(Math.ceil(diffInDays), 'day').toDate()
        if (!showTime) {
            if (timePickType == 'startOfDay')
                newDateFull = dayjs(newDateFull).startOf('day').toDate()
            else newDateFull = dayjs(newDateFull).endOf('day').toDate()
        }
        setDate(newDateFull)
    }

    useEffect(() => {
        if (date) setMonth(dayjs(date).startOf('month').toDate())
    }, [date])

    const handleClear = useCallback((e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setDate(undefined);
        setMonth(new Date());
    }, [setDate]);

    const [month, setMonth] = React.useState<Date>(new Date())

    const onPopoverChange = (open: boolean) => {
        if (!open) setMonth(dayjs(date).startOf('month').toDate())
    }

    return (
        <Popover onOpenChange={onPopoverChange}>
            <PopoverTrigger disabled={disabled} asChild>
                <Button
                    disabled={disabled}
                    variant={'outline'}
                    className={cn('flex font-normal', className)}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                        showTime ? (
                            formatDateReadable(date)
                        ) : (
                            formatDate(date)
                        )
                    ) : (
                        <span>
                            {placeHolder ? placeHolder : 'Chọn thời gian'}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-fit p-0 bg-white" side="bottom" align="start" sideOffset={5} alignOffset={0}>
                <div className="flex justify-between items-center p-1 border-b border-border">
                    <div
                        onClick={() => setMonth(dayjs(month).subtract(1, 'month').toDate())}
                        className="aspect-square border border-border rounded-sm cursor-pointer w-6 justify-center items-center flex hover:bg-slate-100"
                    >
                        <ChevronLeft size={12} />
                    </div>
                    <span className="text-xs font-medium flex gap-1">
                        <select
                            className="appearance-none cursor-pointer bg-white text-xs px-1"
                            value={month.getMonth()}
                            onChange={(e) => {
                                const newMonth = parseInt(e.target.value);
                                setMonth((month) => dayjs(month).month(newMonth).toDate());
                            }}
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i} value={i}>
                                    Tháng {i + 1}
                                </option>
                            ))}
                        </select>
                        <select
                            className="appearance-none cursor-pointer bg-white text-xs px-1"
                            value={month.getFullYear()}
                            onChange={(e) => {
                                const newYear = parseInt(e.target.value);
                                setMonth((month) => dayjs(month).year(newYear).toDate());
                            }}
                        >
                            {Array.from(
                                { length: 20 },
                                (_, i) => (
                                    <option
                                        key={i}
                                        value={i + month.getFullYear() - 10}
                                    >
                                        năm {i + month.getFullYear() - 10}
                                    </option>
                                )
                            )}
                        </select>
                    </span>
                    <div
                        onClick={() => setMonth(dayjs(month).add(1, 'month').toDate())}
                        className="aspect-square border border-border rounded-sm cursor-pointer w-6 justify-center items-center flex hover:bg-slate-100"
                    >
                        <ChevronRight size={12} />
                    </div>
                </div>
                <Calendar
                    mode="single"
                    selected={date}
                    disabled={minDate || maxDate ? [
                        ...(minDate ? [{ before: minDate }] : []),
                        ...(maxDate ? [{ after: maxDate }] : [])
                    ] : undefined}
                    month={month}
                    onMonthChange={setMonth}
                    classNames={{
                        caption: "hidden",
                        day: "h-7 w-7 p-0 font-normal text-xs aria-selected:opacity-100 rounded-md flex items-center justify-center z-10",
                        day_outside: "text-gray-200 opacity-25 text-xs",
                        head_cell: "text-muted-foreground rounded-md w-7 font-normal text-[0.7rem] text-center",
                        cell: "text-center p-0 relative h-7 w-7",
                        table: "w-full border-collapse space-y-1 max-w-[280px]",
                    }}
                    onSelect={handleSelect}
                    className="select-none bg-white"
                />
                {showTime && (
                    <div className="p-2 border-t border-border bg-white">
                        <TimePickerWrapper setDate={setDate} date={date} />
                    </div>
                )}
                {showClear && date && (
                    <div className="p-2 bg-white">
                        <Button
                            onClick={(e) => handleClear(e)}
                            variant={'outline'}
                            className="w-full font-normal text-xs py-1"
                        >
                            Xoá
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}

export default DateTimePickerWrapper
