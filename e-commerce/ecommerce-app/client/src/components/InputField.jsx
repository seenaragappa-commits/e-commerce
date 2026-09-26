/** Label + input + error message, styled consistently across every form. */
export default function InputField({
  label,
  id,
  error,
  hint,
  icon: Icon,
  rightElement,
  className = '',
  as = 'input',
  children,
  ...inputProps
}) {
  const inputId = id || inputProps.name;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  const fieldClass = `input ${Icon ? 'pl-10' : ''} ${rightElement ? 'pr-11' : ''} ${error ? 'input-error' : ''}`;

  const sharedProps = {
    id: inputId,
    className: fieldClass,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    ...inputProps,
  };

  let field = <input {...sharedProps} />;
  if (as === 'textarea') field = <textarea {...sharedProps} />;
  if (as === 'select') field = <select {...sharedProps}>{children}</select>;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        )}
        {field}
        {rightElement && <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">{rightElement}</div>}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="field-error">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
