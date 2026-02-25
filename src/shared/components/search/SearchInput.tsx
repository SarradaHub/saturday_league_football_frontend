import { ComponentProps, forwardRef, ChangeEvent } from "react";
import { FaSearch } from "react-icons/fa";
import { Input } from "@sarradahub/design-system";

interface SearchInputProps
  extends Omit<ComponentProps<typeof Input>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, placeholder, className, ...props }, ref) => {
    return (
      <div style={{ position: "relative" }} className={className}>
        <Input
          ref={ref}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onChange(e.target.value)
          }
          style={{ paddingLeft: "2.5rem" }}
          {...props}
        />
        <FaSearch
          style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#a3a3a3", pointerEvents: "none" }}
          aria-hidden="true"
        />
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";

export default SearchInput;
