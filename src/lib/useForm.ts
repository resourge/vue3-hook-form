/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { ComputedRef, Ref, UnwrapNestedRefs, UnwrapRef, watch as VueWatch, computed, reactive, ref, watchEffect } from 'vue';
import { createFormErrors } from './createFormErrors';
import { useGetterSetter } from './hooks/useGetterSetter';
import { FormErrors, FormKey, Touches } from './types';
import { PathValue } from './types/PathValue';
import { State } from './types/types';
import { useErrors } from './useErrors';
import { ValidationErrors } from './validators/setDefaultOnError';
import { usePersistState } from './hooks/usePersistState';

type ValidationError = {
  error: string;
  path: string | string[];
};

type ValidationWithErrors = {
  errors: string[];
  path: string | string[];
};

type FormOptions<T extends Record<string, any>> = {
  /**
  * Indicates whether the form state should be persisted in memory.
  */
  persistStateKey?: string;
  /**
   * Indicates whether the form should be reset to its initial state after it is submitted.
   */
  resetIsDirtyOnSubmit?: boolean;
  /**
   * A function that validates the form data. This function is invoked whenever the form data
   * 
   * @param form 
   * @param changedKeys 
   * @returns 
   */
  validate?: (form: UnwrapNestedRefs<T>, changedKeys: Array<FormKey<T>>) => void | ValidationErrors | Promise<void | ValidationErrors>;
  /**
   * Indicates whether the form should be validated by default.
   */
  validateDefault?: boolean;
};

type FormField<T, K> = {
  getError: ValidationErrors;
  hasError: boolean;
  isDirty: ComputedRef<boolean>,
  onChange: (newValue: PathValue<T, K>) => void;
  value: PathValue<T, K>;
};

export type FieldOptions<T> = <K extends FormKey<T>>(key: K) => FormField<T, K>
/**
 * Represents the state of a form in your application. It provides various methods and properties
 * to interact with and manage the form's state and data.
 *
 * @template T - The type representing the shape of the form data.
 */
type FormState<T extends Record<string, any>> = {
  /**
   * Updates the value of a specific field in the form.
   *
   * @param key - The key (field name) of the field to update.
   * @param value - The new value to set for the field.
   */
  changeValue: <K extends keyof T>(key: FormKey<T>, value: UnwrapNestedRefs<T[K]>) => void;

  /**
   * An object containing validation errors for the form fields. The structure of this object
   * matches the shape of the form data (T).
   */
  errors: UnwrapNestedRefs<FormErrors<T>>;

  /**
   * Options and configurations for the form fields.
   */
  field: FieldOptions<T>;

  /**
   * Representation of the current state of the form data. This is a reactive object that reflects
   * changes made to the form fields.
   */
  form: UnwrapNestedRefs<T>;

  /**
   * Get the validation errors for a specific field in the form.
   *
   * @param key - The key (field name) of the field to retrieve validation errors for.
   * @returns An array of validation errors for the specified field.
   */
  getErrors: (key: FormKey<T>) => ValidationErrors;

  /**
   * Get the isDirty of a specific field in the form.
   *
   * @param key - The key (field name) of the field to retrieve the isDirty for.
   * @returns The isDirty of the specified field.
   */
  getIsDirtyField: <K extends keyof T>(key: FormKey<T>) => UnwrapNestedRefs<T[K]>;


  /**
   * Get the current value of a specific field in the form.
   *
   * @param key - The key (field name) of the field to retrieve the value for.
   * @returns The current value of the specified field.
   */
  getValue: <K extends keyof T>(key: FormKey<T>) => UnwrapNestedRefs<T[K]>;

  /**
   * Handles form submission by invoking the provided callback function when the form is submitted.
   * Returns a function that can be used as an event handler for form submission events.
   *
   * @param onSubmit - The callback function to be invoked when the form is submitted.
   * @returns An event handler function for form submission.
   */
  handleSubmit: (onSubmit: (form: UnwrapNestedRefs<T>) => void) => (e?: Event) => void;

  /**
   * Checks if a specific field in the form has validation errors.
   *
   * @param key - The key (field name) of the field to check for validation errors.
   * @returns `true` if the field has validation errors, otherwise `false`.
   */
  hasError: (key: FormKey<T>) => boolean;

  /**
   * Indicates whether the form is dirty.
   */
  isDirty: Ref<boolean>;

  /**
   * Indicates whether the form is currently in a valid state (i.e., no validation errors).
   */
  isValid: boolean;

  /**
   * Attaches an event listener to a specific form field. When the field's value changes,
   * the provided callback function is invoked with the new value.
   *
   * @param key - The key (field name) of the field to watch for changes.
   * @param newValue - The new value of the watched field.
   */
  onChange: <K extends keyof T>(key: FormKey<T>) => (newValue: UnwrapNestedRefs<T[K]>) => void;

  /**
   * Resets the form to a specified state by replacing the current form data with the provided
   * partial data object.
   *
   * @param newForm - The partial data object to set as the new form state.
   */
  reset: (newForm: Partial<T>) => void;

  /**
   * Resets the state of isDirty.
   */
  resetIsDirty: () => void;

  /**
   * Sets a validation error for the form or a specific field in the form.
   *
   * @param error - The validation error to set. It can be a single error message or an object
   * containing field-specific error messages.
   */
  setError: (error: ValidationError | ValidationWithErrors) => void;

  /**
   * An object containing the touched state of the form fields. This object tracks which fields
   */
  touches: Touches<T>;

  /**
   * Registers a callback function to watch for changes in the form's state. When any of the form
   * fields change their values, the provided callback is invoked with an array of keys
   * representing the changed fields.
   *
   * @param callback - The callback function to be invoked when form fields change.
   */
  watch: (callback: (changedKeys: Array<FormKey<T>>) => void) => void;
};


export const useForm = <T extends Record<string, any>>(defaultValues: T, options: FormOptions<T> = {}): FormState<T> => {
  const { validate, validateDefault = false, resetIsDirtyOnSubmit = true, persistStateKey } = options;

  const { get, set } = usePersistState<T>();

  const defaultState = persistState && get(persistStateKey) ? get(persistStateKey) : defaultValues;

  const state = reactive<State<T>>({
    errors: {} as FormErrors<T>,
    form: defaultState,
    touches: {} as Touches<T>
  })
  const isValid = ref(false);

  const getterSetter = useGetterSetter<T>();
  const { clearCacheErrors, getErrors, hasError } = useErrors<T>(state, options);
  const onErrors = createFormErrors<T>((errors) => errors);

  const validateForm = async (forceValidation: boolean) => {
    if (validate) {
      // @ts-expect-error no types
      const changedKeys = Object.keys(state.touches) as Array<FormKey<T>>;
      // @ts-expect-error no types
      const result = await validate(state.form, changedKeys);
      const newErrors = onErrors(result)

      // clear
      state.errors = newErrors as UnwrapRef<FormErrors<T>>

      //  update new errors
      if (forceValidation) {
        Object.keys(newErrors).forEach(key => {
          // @ts-expect-error no types
          state.touches[key] = true
        });
      }


      isValid.value = Object.keys(newErrors).length === 0;
    }
  };


  const reset = async (newFrom: Partial<T>) => {
    const keys = Object.keys(newFrom) as Array<FormKey<T>>;
    keys.forEach((key) => {
      const newValue = newFrom[key];
      // @ts-expect-error no types
      getterSetter.set(key, state.form, newValue);
    });

    // errors.splice(0, errors.length);
    isValid.value = false;
    // clear touches
    state.touches = {} as UnwrapRef<Touches<T>>

  };

  if (validateDefault) {
    watchEffect(() => {
      clearCacheErrors();
      validateForm(false);
    });
  }


  const handleSubmit = (onSubmit: (form: UnwrapNestedRefs<T>) => void) => async (e?: Event) => {
    if (e) {
      e.preventDefault();
    }

    validateForm(true);

    if (isValid.value) {
      if (persistStateKey) {
        set(persistStateKey, state.form)
      }
      await onSubmit(state.form);
      // reset is dirty
      if (resetIsDirtyOnSubmit) {
        resetIsDirty() // TODO falar com o ze tem de ser await se possivel
      }
    }
  };

  const field = <K extends keyof T>(key: FormKey<T>): FormField<T[K]> => {
    const value = computed({
      // @ts-expect-error no types
      get: () => getterSetter.get(key, state.form),
      set: (newValue: UnwrapNestedRefs<T[K]>) => {
        // @ts-expect-error no types
        getterSetter.set(key, state.form, newValue);
        // @ts-expect-error no types
        state.touches[key] = true; // Set touched state when the value is changed using v-model
        validateForm(false);
      }
    });

    const isDirty = computed<boolean>(() => {
      const hasFoundParentKey = Object.keys(state.touches).some(touchKey => touchKey.includes(key));
      return hasFoundParentKey ?? state.touches[key]
    })

    const onChange = (newValue: UnwrapNestedRefs<T[K]>) => {
      value.value = newValue; // Use the computed value's setter to update the value and set the touched state
    };

    const getError = () => getErrors(key);
    return { value: value.value, onChange, getError, hasError: (options?: HasErrorOptions<T>) => hasError(key, options), isDirty };

  };

  const getValue = <K extends keyof T>(key: FormKey<T>): UnwrapNestedRefs<T[K]> => {
    // @ts-expect-error no types
    return getterSetter.get(key, state.form);
  };

  const getIsDirtyField = <K extends keyof T>(key: FormKey<T>): UnwrapNestedRefs<T[K]> => {
    return field(key).isDirty.value
  };

  const watch = (callback: (changedKeys: Array<FormKey<T>>) => void) => {
    // @ts-expect-error no types
    VueWatch(state.touches, function () {
      // @ts-expect-error no types
      const changedKeys = Object.keys(state.touches) as Array<FormKey<T>>;
      callback(changedKeys);
    });
  };

  const errors = computed(() => state.errors)

  const form = state.form

  const isDirty = computed(() => {
    const changedKeys = Object.keys(state.touches) as Array<FormKey<T>>
    return changedKeys.length > 0
  })

  const resetIsDirty = () => {
    state.touches = {}
  }

  return {
    errors,
    field,
    form,
    isDirty,
    getErrors,
    handleSubmit,
    hasError,
    getValue,
    getIsDirtyField,
    isValid,
    reset,
    watch,
    resetIsDirty,
    touches: state.touches
  };
};