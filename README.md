# Vue 3 Form Hook

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Description

`useForm` is a custom hook designed to facilitate form state management and validation in Vue 3 applications. This documentation provides a comprehensive guide on how to integrate and utilize `useForm` effectively within your project.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Installation

To install use npm:

```sh
npm install @resourge/vue3-hook-form
```

or with Yarn:

```sh
yarn add @resourge/vue3-hook-form
```

## Usage

```javascript
import { useForm } from 'vue3-hook-form';
```

## Defining Form Data Model and Validation Schema

```javascript
import { object, string } from '@resourge/schema';

// Define the shape of your form data
export class LoginUserFormModel {
  public username = '';
  public password = '';

  toModel() {
    return {
      username: this.username,
      password: this.password,
    };
  }
}

// Define a schema for form validation
const schema = object<LoginUserFormModel>({
  username: string().notNullable().required('Username is required'),
  password: string().notNullable().required('Password is required')
});
```

## Creating a Form Instance

```javascript
export const useLoginForm = () => {
  return useForm<LoginUserFormModel>(new LoginUserFormModel(), {
    validate: (form) => {
      return schema.validate(form);
    },
    validateDefault: true
  });
};
```

## Using the Form Instance in Vue Component

```vue
<template>
  <form @submit.prevent="onSubmit">
    <FormControl :label="T.pages.login.form.username" :errors="getErrors('username')">
      <Input v-model="form.username" type="text" />
    </FormControl>
    <FormControl :label="T.pages.login.form.password" :errors="getErrors('password')">
      <Input v-model="form.password" type="password" />
    </FormControl>
    <div class="form-actions">
      <Button :label="T.pages.login.actions.enter" type="submit" variant="primary" />
    </div>
  </form>
</template>

<script>
import { useLoginForm } from '../modules/useForm.ts';

export default {
  setup() {
    const { form, handleSubmit, getErrors } = useLoginForm();

    const onSubmit = handleSubmit(async () => {
      // Your form submission logic here
    });

    return {
      form,
      onSubmit,
      getErrors
    };
  }
};
</script>
```

### FormState

`FormState` represents the state of a form managed by `useForm`. It offers various methods and properties to interact with and manage the form's state and data.

## Properties and Methods

- **`changeValue(key, value)`**: Updates the value of a specific field in the form.
- **`errors`**: An object containing validation errors for the form fields.
- **`field`**: Options and configurations for the form fields.
- **`form`**: Representation of the current state of the form data.
- **`getErrors(key)`**: Get the validation errors for a specific field in the form.
- **`getValue(key)`**: Get the current value of a specific field in the form.
- **`handleSubmit(onSubmit)`**: Handles form submission.
- **`hasError(key)`**: Checks if a specific field in the form has validation errors.
- **`isValid`**: Indicates whether the form is currently in a valid state.
- **`onChange(key)`**: Attaches an event listener to a specific form field.
- **`reset(newForm)`**: Resets the form to a specified state.
- **`setError(error)`**: Sets a validation error for the form or a specific field.
- **`watch(callback)`**: Registers a callback function to watch for changes in the form's state.

### Support for Complex Forms

`useForm` supports complex forms such as wizards, multi-step, and nested state. Here's an example of defining a nested form:

```javascript
// Define the shape of your form data
export class UserAddressModel {
  public street = '';
  public city = '';
  public postalCode = '';
}

export class UserProfileModel {
  public firstName = '';
  public lastName = '';
  public address = new UserAddressModel();
}

// Define a schema for nested form validation
const addressSchema = object<UserAddressModel>({
  street: string().notNullable().required('Street is required'),
  city: string().notNullable().required('City is required'),
  postalCode: string().notNullable().required('Postal code is required')
});

const userSchema = object<UserProfileModel>({
  firstName: string().notNullable().required('First name is required'),
  lastName: string().notNullable().required('Last name is required'),
  address: addressSchema // Nested validation schema
});

// Create a form instance with default values and validation
export const useUserProfileForm = () => {
  return useForm<UserProfileModel>(new UserProfileModel(), {
    validate: (form) => {
      return userSchema.validate(form);
    },
    validateDefault: true
  });
};
```

For more detailed usage instructions, refer to the [documentation](#documentation).

## Documentation

For comprehensive documentation and usage examples, visit the [Vue 3 Form Hook documentation](https://resourge.vercel.app/docs/vue3-hook-form/intro).

## Contributing

Contributions to Vue 3 Form Hook are welcome! To contribute, please follow the [contributing guidelines](CONTRIBUTING.md).

## License

Vue 3 Form Hook is licensed under the [MIT License](LICENSE).

## Contact

For questions or support, please contact the maintainers:
- GitHub: [Resourge](https://github.com/resourge)