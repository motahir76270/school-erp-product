import { useFormContext, Controller, FieldValues, Path } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface FormCheckboxProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function FormCheckbox<T extends FieldValues>({
  name,
  label,
  description,
  disabled,
}: FormCheckboxProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={name as string}
            checked={field.value}
            onCheckedChange={field.onChange}
            disabled={disabled}
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor={name as string} className="cursor-pointer">
              {label}
            </Label>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      )}
    />
  );
}
