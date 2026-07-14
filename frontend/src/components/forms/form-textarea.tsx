import { useFormContext, Controller, FieldValues, Path } from 'react-hook-form';
import { Textarea, TextareaProps } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormTextareaProps<T extends FieldValues> extends TextareaProps {
  name: Path<T>;
  label: string;
  description?: string;
  required?: boolean;
}

export function FormTextarea<T extends FieldValues>({
  name,
  label,
  description,
  required,
  className,
  ...props
}: FormTextareaProps<T>) {
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
          <Textarea
            id={name as string}
            className={cn(errorMessage && 'border-destructive', className)}
            {...props}
            {...field}
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
