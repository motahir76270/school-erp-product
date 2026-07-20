// components/ui/radio-group.tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  options?: RadioOption[]
  variant?: 'default' | 'cards'
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, defaultValue, options, variant = 'default', children, ...props }, ref) => {
    const [selectedValue, setSelectedValue] = React.useState(defaultValue || value || "")

    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value)
      }
    }, [value])

    const handleValueChange = (newValue: string) => {
      setSelectedValue(newValue)
      onValueChange?.(newValue)
    }

    // If options are provided, render them directly
    if (options) {
      return (
        <div
          ref={ref}
          className={cn(
            "grid gap-2",
            variant === 'cards' ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1",
            className
          )}
          role="radiogroup"
          {...props}
        >
          {options.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
                variant === 'cards' ? "flex-col justify-center p-4" : "flex-row",
                selectedValue === option.value
                  ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => handleValueChange(option.value)}
            >
              <input
                type="radio"
                value={option.value}
                checked={selectedValue === option.value}
                onChange={() => handleValueChange(option.value)}
                className="sr-only"
              />
              {option.icon && <span className="text-2xl">{option.icon}</span>}
              <span className={cn(
                "text-sm",
                selectedValue === option.value ? "font-medium text-primary" : "text-foreground"
              )}>
                {option.label}
              </span>
              {selectedValue === option.value && (
                <span className="ml-auto text-primary">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </label>
          ))}
        </div>
      )
    }

    // If children are provided, wrap them with context
    return (
      <RadioGroupContext.Provider value={{ value: selectedValue, onValueChange: handleValueChange }}>
        <div
          ref={ref}
          className={cn("grid gap-2", className)}
          role="radiogroup"
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

interface RadioGroupContextValue {
  value: string
  onValueChange: (value: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null)

interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
  id: string
  label?: string
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, id, label, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext)
    
    if (!context) {
      throw new Error("RadioGroupItem must be used within a RadioGroup")
    }

    const { value: selectedValue, onValueChange } = context
    const isChecked = selectedValue === value

    return (
      <div className="flex items-center space-x-2">
        <input
          ref={ref}
          type="radio"
          id={id}
          value={value}
          checked={isChecked}
          onChange={() => onValueChange(value)}
          className={cn(
            "h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            "appearance-none checked:border-transparent checked:bg-primary relative",
            "after:content-[''] after:absolute after:inset-0 after:flex after:items-center after:justify-center after:text-white",
            "checked:after:content-['●'] after:text-xs after:font-bold",
            className
          )}
          {...props}
        />
        {label && (
          <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
            {label}
          </label>
        )}
      </div>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }