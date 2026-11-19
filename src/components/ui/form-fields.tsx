import type { ReactNode } from 'react';
import { Controller, useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { Checkbox } from './checkbox';
import { TextField, type TextFieldProps } from './text-field';

type ControlledProps<T extends FieldValues> = {
  control: Control<T, any, any>;
  name: FieldPath<T>;
};

/** Campo de texto ligado ao React Hook Form (valor, erro e foco no primeiro erro). */
export function FormTextField<T extends FieldValues>({
  control,
  name,
  ...props
}: ControlledProps<T> & Omit<TextFieldProps, 'value' | 'onChangeText' | 'error' | 'ref'>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          ref={field.ref}
          value={typeof field.value === 'string' ? field.value : ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export function FormCheckbox<T extends FieldValues>({
  control,
  name,
  label,
  accessibilityLabel,
}: ControlledProps<T> & { label: ReactNode; accessibilityLabel: string }) {
  const { field, fieldState } = useController({ control, name });
  return (
    <Checkbox
      checked={field.value === true}
      onChange={(checked) => {
        field.onChange(checked);
        field.onBlur();
      }}
      label={label}
      accessibilityLabel={accessibilityLabel}
      error={fieldState.error?.message}
    />
  );
}
