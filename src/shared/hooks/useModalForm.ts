import {
  useState,
  useCallback,
  useRef,
  useEffect,
  ChangeEvent,
  FormEvent,
} from "react";

interface FormStateObserver<T = Record<string, unknown>> {
  (state: FormState<T>): void;
}

interface FormState<T = Record<string, unknown>> {
  data: T;
  error: string | null;
  isSubmitting: boolean;
  isValid: boolean;
}

interface ValidationStrategy<T> {
  validate(data: T): { isValid: boolean; errors: string[] };
}

class DefaultValidationStrategy<T extends Record<string, unknown>>
  implements ValidationStrategy<T>
{
  validate(data: T): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined) {
        errors.push(`${key} is required`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }
}

abstract class BaseFormHandler<T extends Record<string, unknown>> {
  protected observers: FormStateObserver[] = [];
  protected validationStrategy: ValidationStrategy<T>;

  constructor(validationStrategy?: ValidationStrategy<T>) {
    this.validationStrategy =
      validationStrategy || new DefaultValidationStrategy<T>();
  }

  protected async executeSubmit(
    data: T,
    callback: (data: T) => Promise<void>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const validation = this.validationStrategy.validate(data);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(", ") };
      }

      await callback(data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      };
    }
  }

  addObserver(observer: FormStateObserver): void {
    this.observers.push(observer);
  }

  removeObserver(observer: FormStateObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  protected notifyObservers(state: FormState<T>): void {
    this.observers.forEach((observer) => observer(state));
  }
}

class ModalFormHandler<
  T extends Record<string, unknown>,
> extends BaseFormHandler<T> {
  private state: FormState<T>;

  constructor(initialState: T, validationStrategy?: ValidationStrategy<T>) {
    super(validationStrategy);
    this.state = {
      data: initialState,
      error: null,
      isSubmitting: false,
      isValid: true,
    };
  }

  updateState(updates: Partial<FormState<T>>): void {
    this.state = { ...this.state, ...updates };
    this.notifyObservers(this.state);
  }

  async handleSubmit(callback: (data: T) => Promise<void>): Promise<void> {
    this.updateState({ isSubmitting: true, error: null });
    const result = await this.executeSubmit(this.state.data, callback);
    this.updateState({
      isSubmitting: false,
      error: result.error || null,
    });
  }

  handleChange(name: string, value: unknown): void {
    const newData = { ...this.state.data, [name]: value };
    const validation = this.validationStrategy.validate(newData);
    this.updateState({
      data: newData,
      error: null,
      isValid: validation.isValid,
    });
  }

  resetForm(initialState: T): void {
    this.updateState({
      data: initialState,
      error: null,
      isSubmitting: false,
      isValid: true,
    });
  }

  getState(): FormState<T> {
    return this.state;
  }
}

export const useModalForm = <T extends Record<string, unknown>>(
  initialState: T,
  validationStrategy?: ValidationStrategy<T>,
) => {
  const formHandlerRef = useRef<ModalFormHandler<T>>();

  if (!formHandlerRef.current) {
    formHandlerRef.current = new ModalFormHandler(
      initialState,
      validationStrategy,
    );
  }

  const [state, setState] = useState<FormState<T>>(
    formHandlerRef.current.getState(),
  );

  const observer: FormStateObserver<Record<string, unknown>> = useCallback(
    (newState: FormState<Record<string, unknown>>) => {
      setState(newState as FormState<T>);
    },
    [],
  );

  useEffect(() => {
    const handler = formHandlerRef.current!;
    handler.addObserver(observer);
    return () => handler.removeObserver(observer);
  }, [observer]);

  const handleChange = useCallback(
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value } = event.target;
      formHandlerRef.current!.handleChange(name, value);
    },
    [],
  );

  const handleSubmit = useCallback(
    async (callback: (data: T) => Promise<void>, event: FormEvent) => {
      event.preventDefault();
      await formHandlerRef.current!.handleSubmit(callback);
    },
    [],
  );

  const resetForm = useCallback(() => {
    formHandlerRef.current!.resetForm(initialState);
  }, [initialState]);

  const setFormData = useCallback((updater: T | ((prev: T) => T)) => {
    const handler = formHandlerRef.current!;
    const current = handler.getState().data;
    const nextData =
      typeof updater === "function" ? (updater as (prev: T) => T)(current) : updater;
    handler.updateState({ data: nextData });
  }, []);

  return {
    formData: state.data,
    setFormData,
    error: state.error,
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,
    handleChange,
    handleSubmit,
    resetForm,
  };
};
