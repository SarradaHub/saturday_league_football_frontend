import { ComponentProps, forwardRef, ChangeEvent } from "react";
import { FaSearch } from "react-icons/fa";
import { Input, cn } from "@sarradahub/design-system";

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
      <div className={cn("relative", className)}>
        <Input
          ref={ref}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onChange(e.target.value)
          }
          className="pl-10"
          {...props}
        />
        <FaSearch
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
          aria-hidden="true"
        />
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";

export default SearchInput;
