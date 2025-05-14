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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CaretSortIcon } from '@radix-ui/react-icons'
import { CheckIcon } from 'lucide-react'
import React, { HTMLAttributes } from 'react'

interface SelectWrapperProps {
    trigger?: HTMLAttributes<HTMLButtonElement>
    placeholder?: string
    value?: string
    data?: {
        label: string
        value: string
    }[]
    onChange?: (value?: string, label?: string) => void
    disabled?: boolean
    showSearch?: boolean
    showClear?: boolean
}

const SelectWrapper = ({
    data,
    trigger,
    placeholder,
    value,
    onChange,
    disabled,
    showSearch = true,
    showClear = true,
}: SelectWrapperProps) => {
    const [open, setOpen] = React.useState(false)
    const buttonTriggerRef = React.useRef<HTMLButtonElement>(null)
    const handleClear = () => {
        onChange && onChange()
    }
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger disabled={disabled} asChild>
                <Button
                    disabled={disabled}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    {...trigger}
                    className={cn('justify-between', trigger?.className)}
                    ref={buttonTriggerRef}
                >
                    {value
                        ? data &&
                          data.find((item) => item.value === value)?.label
                        : placeholder}
                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0"
                style={{
                    width: buttonTriggerRef.current?.offsetWidth,
                }}
            >
                <Command>
                    {showSearch && (
                        <CommandInput
                            placeholder="Tìm kiếm..."
                            className="h-9"
                        />
                    )}
                    <CommandList>
                        <CommandEmpty>Không có dữ liệu.</CommandEmpty>

                        <CommandGroup>
                            {data &&
                                data.map((item) => (
                                    <CommandItem
                                        key={item.value}
                                        onSelect={() => {
                                            onChange &&
                                                onChange(item.value, item.label)
                                            setOpen(false)
                                        }}
                                        className={cn(
                                            value === item.value &&
                                                'bg-gray-200'
                                        )}
                                    >
                                        {item.label}
                                        <CheckIcon
                                            className={cn(
                                                'ml-auto h-4 w-4',
                                                value === item.value
                                                    ? 'opacity-100'
                                                    : 'opacity-0'
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                        </CommandGroup>
                        <CommandSeparator />
                    </CommandList>
                    {value && showClear && (
                        <CommandItem
                            onSelect={handleClear}
                            className="flex-1 justify-center cursor-pointer"
                        >
                            Xoá
                        </CommandItem>
                    )}
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export default SelectWrapper
