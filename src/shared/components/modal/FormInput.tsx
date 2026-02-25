import { ChangeEvent, InputHTMLAttributes } from "react";
import { Input, Textarea, Select } from "@sarradahub/design-system";

type InputElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

type FormInputType = "text" | "textarea" | "select" | "number";

interface FormInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<InputElement>) => void;
  placeholder: string;
  required?: boolean;
  type?: FormInputType;
  options?: { id: number | string; name: string }[];
  rows?: number;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  error?: string;
  min?: string;
}

const FormInput = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
  options = [],
  rows = 3,
  inputProps = {},
  error,
  min,
}: FormInputProps) => {
  const renderField = () => {
    if (type === "textarea") {
      return (
        <Textarea
          name={name}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            onChange(e as ChangeEvent<InputElement>)
          }
          placeholder={placeholder}
          required={required}
          rows={rows}
          error={error}
          label={label}
          {...(inputProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      );
    }

    if (type === "select") {
      const selectOptions = [
        { value: "", label: placeholder },
        ...options.map((option) => ({
          value: String(option.id),
          label: option.name,
        })),
      ];

      return (
        <Select
          name={name}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            onChange(e as ChangeEvent<InputElement>)
          }
          required={required}
          error={error}
          label={label}
          options={selectOptions}
        />
      );
    }

    return (
      <Input
        name={name}
        type={type}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(e as ChangeEvent<InputElement>)
        }
        placeholder={placeholder}
        required={required}
        error={error}
        label={label}
        {...(min ? { min } : {})}
        {...inputProps}
      />
    );
  };

  return <div style={{ marginBottom: "1.5rem" }}>{renderField()}</div>;
};

export default FormInput;
