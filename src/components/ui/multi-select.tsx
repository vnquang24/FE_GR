import { cva, type VariantProps } from 'class-variance-authority'
import { CheckIcon, ChevronDown, WandSparkles, XCircle } from 'lucide-react'
import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn, stringToSlug } from '@/lib/utils'

/**
 * Variants for the multi-select component to handle different styles.
 * Uses class-variance-authority (cva) to define different styles based on "variant" prop.
 */
const multiSelectVariants = cva(
    'm-1 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300',
    {
        variants: {
            variant: {
                default:
                    'bg-white border-foreground/10 text-foreground bg-card hover:bg-card/80',
                secondary:
                    'bg-white border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80',
                destructive:
                    'bg-white border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
                inverted: 'inverted',
                outline: 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

/**
 * Props for MultiSelect component
 */
interface MultiSelectProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof multiSelectVariants> {
    /**
     * An array of option objects to be displayed in the multi-select component.
     * Each option object has a label, value, and an optional icon.
     */
    data: {
        /** The text to display for the option. */
        label: string
        /** The unique value associated with the option. */
        value: string
        /** Optional icon component to display alongside the option. */
        icon?: React.ComponentType<{ className?: string }>

        description?: string
    }[]

    /**
     * Callback function triggered when the selected values change.
     * Receives an array of the new selected values.
     */
    onValueChange?: (
        payload: Array<{
            /** The text to display for the option. */
            label: string
            /** The unique value associated with the option. */
            value: string
        }>
    ) => void

    /** The default selected values when the component mounts. */
    defaultValue?: string[]
    value?: string[]

    /**
     * Placeholder text to be displayed when no values are selected.
     * Optional, defaults to "Select options".
     */
    placeholder?: string

    /**
     * Animation duration in seconds for the visual effects (e.g., bouncing badges).
     * Optional, defaults to 0 (no animation).
     */
    animation?: number

    /**
     * Maximum number of items to display. Extra selected items will be summarized.
     * Optional, defaults to 3.
     */
    maxCount?: number
    maxCountLabel?: string

    /**
     * The modality of the popover. When set to true, interaction with outside elements
     * will be disabled and only popover content will be visible to screen readers.
     * Optional, defaults to false.
     */
    modalPopover?: boolean

    /**
     * If true, renders the multi-select component as a child of another component.
     * Optional, defaults to false.
     */
    asChild?: boolean

    /**
     * Additional class names to apply custom styles to the multi-select component.
     * Optional, can be used to add custom styles.
     */
    className?: string
    
    /**
     * Additional class names to apply custom styles to the popover content.
     * Optional, can be used to add custom styles.
     */
    popoverContentClassName?: string
}

export const MultiSelect = React.forwardRef<
    HTMLButtonElement,
    MultiSelectProps
>(
    (
        {
            data,
            onValueChange,
            variant,
            defaultValue = [],
            value = [],
            placeholder = '',
            animation = 0,
            maxCount = 10,
            maxCountLabel = '',
            modalPopover = false,
           // asChild = false,
            className,
            popoverContentClassName,
            ...props
        },
        ref
    ) => {
        const [selectedValues, setSelectedValues] =
            React.useState<string[]>(defaultValue)
        const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)
        const [isAnimating, setIsAnimating] = React.useState(false)

        const [optionList, setOptionList] = React.useState(data)


        React.useEffect(() => {
            if (value.length > 0) {
                setSelectedValues(value)
            }
        }, [value])

        React.useEffect(() => {
            setOptionList(data)
            setSelectedValues((preValue) => {
                const newSelectedValues = preValue.filter((value) =>
                    data.find((o) => o.value === value)
                )
                return newSelectedValues
            })
        }, [data])

        const handleInputKeyDown = (
            event: React.KeyboardEvent<HTMLInputElement>
        ) => {
            if (event.key === 'Enter') {
                setIsPopoverOpen(true)
            } else if (
                event.key === 'Backspace' &&
                !event.currentTarget.value
            ) {
                const newSelectedValues = [...selectedValues]
                newSelectedValues.pop()
                setSelectedValues(newSelectedValues)
                if (onValueChange) {
                    onValueChange(
                        newSelectedValues.map((value) => ({
                            label:
                                data.find((o) => o.value === value)?.label ||
                                '',
                            value,
                        }))
                    )
                }
            }
        }

        const toggleOption = (option: string) => {
            const newSelectedValues = selectedValues.includes(option)
                ? selectedValues.filter((value) => value !== option)
                : [...selectedValues, option]
            setSelectedValues(newSelectedValues)
            if (onValueChange) {
                onValueChange(
                    newSelectedValues.map((value) => ({
                        label: data.find((o) => o.value === value)?.label || '',
                        value,
                    }))
                )
            }
        }

        const handleClear = () => {
            setSelectedValues([])
            if (onValueChange) {
                onValueChange([])
            }
        }

        const handleTogglePopover = () => {
            setIsPopoverOpen((prev) => !prev)
        }

        const clearExtraOptions = () => {
            const newSelectedValues = selectedValues.slice(0, maxCount)
            setSelectedValues(newSelectedValues)
            if (onValueChange) {
                onValueChange(
                    newSelectedValues.map((value) => ({
                        label: data.find((o) => o.value === value)?.label || '',
                        value,
                    }))
                )
            }
        }

        const toggleAll = () => {
            if (selectedValues.length === data.length) {
                handleClear()
            } else {
                const allValues = data.map((option) => ({
                    label: option.label,
                    value: option.value,
                }))
                setSelectedValues(allValues.map((option) => option.value))
                if (onValueChange) {
                    onValueChange(allValues)
                }
            }
        }

        const onPopoverOpenChange = (isOpen: boolean) => {
            setIsPopoverOpen(isOpen)
            if (!isOpen) {
                setOptionList(data)
            }
        }

        return (
            <Popover
                open={isPopoverOpen}
                onOpenChange={onPopoverOpenChange}
                modal={modalPopover}
            >
                <PopoverTrigger asChild>
                    <Button
                        ref={ref}
                        {...props}
                        onClick={handleTogglePopover}
                        className={cn(
                            'flex w-full px-1 rounded-md border items-center justify-between bg-white h-fit',
                            variant === 'default' ? 'hover:bg-gray-50' : 'hover:bg-inherit',
                            className
                        )}
                    >
                        {selectedValues.length > 0 ? (
                            <div className="flex justify-between items-center w-full">
                                <div className="flex flex-wrap items-center gap-1">
                                    {selectedValues
                                        .slice(0, maxCount)
                                        .map((value) => {
                                            const option = data.find(
                                                (o) => o.value === value
                                            )
                                            const IconComponent = option?.icon
                                            return (
                                                <Badge
                                                    key={value}
                                                    className={cn(
                                                        isAnimating
                                                            ? 'animate-bounce'
                                                            : '',
                                                        multiSelectVariants({
                                                            variant,
                                                        }),
                                                        'my-0',
                                                        variant === 'default' ? 'bg-white' : ''
                                                    )}
                                                    style={{
                                                        animationDuration: `${animation}s`,
                                                    }}
                                                >
                                                    {IconComponent && (
                                                        <IconComponent className="h-4 w-4 mr-2" />
                                                    )}
                                                    {option?.label}
                                                    <XCircle
                                                        className="ml-2 h-4 w-4 cursor-pointer text-red-500"
                                                        onClick={(event) => {
                                                            event.stopPropagation()
                                                            toggleOption(value)
                                                        }}
                                                    />
                                                </Badge>
                                            )
                                        })}
                                    {selectedValues.length > maxCount && (
                                        <Badge
                                            className={cn(
                                                'text-foreground border-foreground/1',
                                                isAnimating
                                                    ? 'animate-bounce'
                                                    : '',
                                                multiSelectVariants({ variant }),
                                                variant === 'default' ? 'bg-white' : 'bg-transparent hover:bg-transparent'
                                            )}
                                            style={{
                                                animationDuration: `${animation}s`,
                                            }}
                                        >
                                            {`+ ${selectedValues.length - maxCount} ${maxCountLabel && maxCountLabel}`}
                                            <XCircle
                                                className="ml-2 h-4 w-4 cursor-pointer text-red-500"
                                                onClick={(event) => {
                                                    event.stopPropagation()
                                                    clearExtraOptions()
                                                }}
                                            />
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between w-full mx-auto">
                                <span className="text-sm text-muted-foreground mx-3 font-normal">
                                    {placeholder}
                                </span>
                                <ChevronDown className="h-4 cursor-pointer text-muted-foreground mx-2" />
                            </div>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className={cn(
                        'w-auto p-0 bg-white',
                        popoverContentClassName
                    )}
                    align="start"
                    onEscapeKeyDown={() => setIsPopoverOpen(false)}
                >
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Tìm kiếm..."
                            onKeyDown={handleInputKeyDown}
                            onValueChange={(value) => {
                                setOptionList(
                                    data.filter((option) =>
                                        stringToSlug(
                                            option.label.toLowerCase()
                                        ).includes(
                                            stringToSlug(value.toLowerCase())
                                        )
                                    )
                                )
                            }}
                        />
                        <CommandList className="max-h-[300px] overflow-auto">
                            <CommandEmpty>Không có kết quả.</CommandEmpty>
                            <CommandGroup>
                                {optionList.length > 0 &&
                                    optionList.length == data.length && (
                                        <CommandItem
                                            key="all"
                                            onSelect={toggleAll}
                                            className="cursor-pointer"
                                        >
                                            <div
                                                className={cn(
                                                    'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                                    selectedValues.length ===
                                                        data.length
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'opacity-50 [&_svg]:invisible'
                                                )}
                                            >
                                                <CheckIcon className="h-4 w-4" />
                                            </div>
                                            <span>(Chọn tất cả)</span>
                                        </CommandItem>
                                    )}
                                {optionList.map((option) => {
                                    const isSelected = selectedValues.includes(option.value);
                                    return (
                                        <CommandItem
                                            key={option.value}
                                            onSelect={() => toggleOption(option.value)}
                                            className="cursor-pointer"
                                        >
                                            <div
                                                className={cn(
                                                    'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                                    isSelected
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'opacity-50 [&_svg]:invisible'
                                                )}
                                            >
                                                <CheckIcon className="h-4 w-4" />
                                            </div>
                                            {option.icon && (
                                                <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                            )}
                                            <span>{option.label}</span>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                        <CommandSeparator />
                        <CommandGroup>
                            <div className="flex items-center justify-between">
                                {selectedValues.length > 0 && (
                                    <>
                                        <CommandItem
                                            onSelect={handleClear}
                                            className="flex-1 justify-center cursor-pointer"
                                        >
                                            Xoá tất cả
                                        </CommandItem>
                                        <Separator
                                            orientation="vertical"
                                            className="flex min-h-6 h-full"
                                        />
                                    </>
                                )}
                                <CommandItem
                                    onSelect={() => setIsPopoverOpen(false)}
                                    className="flex-1 justify-center cursor-pointer max-w-full"
                                >
                                    Đóng
                                </CommandItem>
                            </div>
                        </CommandGroup>
                    </Command>
                </PopoverContent>
                {animation > 0 && selectedValues.length > 0 && (
                    <WandSparkles
                        className={cn(
                            'cursor-pointer my-2 text-foreground bg-background w-3 h-3',
                            isAnimating ? '' : 'text-muted-foreground'
                        )}
                        onClick={() => setIsAnimating(!isAnimating)}
                    />
                )}
            </Popover>
        )
    }
)

MultiSelect.displayName = 'MultiSelect'
