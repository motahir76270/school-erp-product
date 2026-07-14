import { useFormContext, Controller, FieldValues, Path } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
}

interface FormSelectProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  options: Option[];
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FormSelect<T extends FieldValues>({
  name,
  label,
  options,
  placeholder,
  description,
  required,
  disabled,
  className,
}: FormSelectProps<T>) {
  const {
    control,
    formState: { errors },
  } = useFormContext<T>();

  const error = errors[name];
  const errorMessage = error?.message as string | undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={name as string} className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select
            disabled={disabled}
            onValueChange={field.onChange}
            defaultValue={field.value}
            value={field.value}
          >
            <SelectTrigger className={cn(errorMessage && 'border-destructive', className)}>
              <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {description && !errorMessage && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
    </div>
  );
}
