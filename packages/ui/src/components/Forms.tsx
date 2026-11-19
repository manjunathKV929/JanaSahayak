import React, {
  forwardRef,
  useId,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '../utils/cn.js';

export interface FormFieldProps {
  id?: string;
  label: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (props: {
    id: string;
    'aria-describedby'?: string | undefined;
    'aria-invalid'?: boolean | undefined;
    required?: boolean | undefined;
  }) => ReactNode;
}

export function FormField({
  id: customId,
  label,
  helperText,
  error,
  required,
  className,
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const id = customId ?? `field-${generatedId}`;
  const helperId = helperText ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      <label
        htmlFor={id}
        className="text-sm font-semibold text-civic-navy flex items-center gap-1 font-heading"
      >
        <span>{label}</span>
        {required && (
          <span className="text-civic-error" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        required,
      })}

      {helperText && !error && (
        <p id={helperId} className="text-xs text-civic-muted leading-relaxed">
          {helperText}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-civic-error leading-relaxed flex items-center gap-1"
        >
          <svg
            className="w-3.5 h-3.5 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { error, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full min-h-[44px] px-3.5 py-2.5 bg-white text-civic-charcoal border rounded-md text-base leading-normal font-sans',
        'border-civic-border placeholder:text-civic-muted/70',
        'focus:outline-none focus:ring-2 focus:ring-civic-navy focus:border-civic-navy',
        'disabled:bg-civic-surface disabled:text-civic-muted disabled:cursor-not-allowed',
        error && 'border-civic-error focus:ring-civic-error focus:border-civic-error',
        className,
      )}
      {...rest}
    />
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error, className, rows = 4, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'w-full px-3.5 py-2.5 bg-white text-civic-charcoal border rounded-md text-base leading-relaxed font-sans',
        'border-civic-border placeholder:text-civic-muted/70',
        'focus:outline-none focus:ring-2 focus:ring-civic-navy focus:border-civic-navy',
        'disabled:bg-civic-surface disabled:text-civic-muted disabled:cursor-not-allowed',
        error && 'border-civic-error focus:ring-civic-error focus:border-civic-error',
        className,
      )}
      {...rest}
    />
  );
});

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, placeholder, error, className, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        'w-full min-h-[44px] px-3.5 py-2.5 bg-white text-civic-charcoal border rounded-md text-base leading-normal font-sans cursor-pointer',
        'border-civic-border',
        'focus:outline-none focus:ring-2 focus:ring-civic-navy focus:border-civic-navy',
        'disabled:bg-civic-surface disabled:text-civic-muted disabled:cursor-not-allowed',
        error && 'border-civic-error focus:ring-civic-error focus:border-civic-error',
        className,
      )}
      {...rest}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  );
});

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  description?: string;
  error?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, error, id: customId, className, ...rest },
  ref,
) {
  const generatedId = useId();
  const id = customId ?? `checkbox-${generatedId}`;
  const descId = description ? `${id}-desc` : undefined;

  return (
    <div
      className={cn(
        'flex items-start gap-3 min-h-[44px] py-1 cursor-pointer select-none',
        className,
      )}
    >
      <input
        ref={ref}
        type="checkbox"
        id={id}
        aria-describedby={descId}
        className={cn(
          'mt-1 h-5 w-5 rounded border border-civic-border text-civic-navy bg-white cursor-pointer',
          'focus:ring-2 focus:ring-civic-navy focus:ring-offset-2',
          error && 'border-civic-error',
        )}
        {...rest}
      />
      <label
        htmlFor={id}
        className="cursor-pointer text-sm font-medium text-civic-charcoal leading-snug"
      >
        <span>{label}</span>
        {description && (
          <span id={descId} className="block text-xs text-civic-muted font-normal mt-0.5">
            {description}
          </span>
        )}
      </label>
    </div>
  );
});

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  label: string;
  options: RadioOption[];
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  className?: string;
}

export function RadioGroup({
  name,
  label,
  options,
  value,
  onChange,
  error,
  required,
  className,
}: RadioGroupProps) {
  const groupId = useId();
  const errorId = error ? `${groupId}-error` : undefined;

  return (
    <fieldset
      aria-describedby={errorId}
      aria-required={required}
      className={cn('flex flex-col gap-2', className)}
    >
      <legend className="text-sm font-semibold text-civic-navy font-heading flex items-center gap-1 mb-1">
        <span>{label}</span>
        {required && (
          <span className="text-civic-error" aria-hidden="true">
            *
          </span>
        )}
      </legend>

      <div className="space-y-2">
        {options.map((opt) => {
          const radioId = `${name}-${opt.value}`;
          return (
            <div
              key={opt.value}
              className={cn(
                'flex items-start gap-3 min-h-[44px] p-3 rounded-md border border-civic-border bg-white',
                'hover:border-civic-navy/40 transition-colors cursor-pointer',
                value === opt.value &&
                  'border-civic-navy ring-1 ring-civic-navy bg-civic-navy-light/20',
              )}
            >
              <input
                type="radio"
                id={radioId}
                name={name}
                value={opt.value}
                checked={value === opt.value}
                onChange={onChange}
                readOnly={onChange ? undefined : true}
                disabled={opt.disabled}
                className="mt-0.5 h-4 w-4 border-civic-border text-civic-navy focus:ring-2 focus:ring-civic-navy"
              />
              <label
                htmlFor={radioId}
                className="cursor-pointer text-sm text-civic-charcoal font-medium leading-snug"
              >
                <span>{opt.label}</span>
                {opt.description && (
                  <span className="block text-xs text-civic-muted font-normal mt-0.5">
                    {opt.description}
                  </span>
                )}
              </label>
            </div>
          );
        })}
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-civic-error mt-1">
          {error}
        </p>
      )}
    </fieldset>
  );
}
