import { useFormContext, Controller, FieldValues, Path } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormDateProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
}

function formatDateValue(value: unknown): string {
  if (!value) return '';
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  return String(value);
}

export function FormDate<T extends FieldValues>({
  name,
  label,
  description,
  required,
  disabled,
  min,
  max,
  className,
}: FormDateProps<T>) {
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
          <input
            type="date"
            id={name as string}
            disabled={disabled}
            min={min}
            max={max}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-destructive',
              className
            )}
            {...field}
            value={formatDateValue(field.value)}
          />
        )}
      />
      {description && !errorMessage && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
    </div>
  );
}
