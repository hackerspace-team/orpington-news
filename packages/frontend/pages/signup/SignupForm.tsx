import React from 'react';
import { Box, Button, HStack, VStack } from '@chakra-ui/react';
import * as Yup from 'yup';
import { Form, Formik } from 'formik';
import { AvatarField, PasswordField, StringField } from '@components/forms';
import { SignupFormData } from '@features/Auth';

export interface SignupFormProps {
  isLoading?: boolean;
  isDisabled?: boolean;
  onSubmit: (data: SignupFormData) => void;
}

export const validationSchema = Yup.object({
  username: Yup.string().required('Please enter your username.'),
  displayName: Yup.string().required('Please enter your display name.'),
  password: Yup.string().required('Please enter your password.'),
  passwordConfirm: Yup.string()
    .oneOf([Yup.ref('password')], "Passwords don't match.")
    .required('Please confirm your password.'),
});

const initialValues: SignupFormData = {
  username: '',
  password: '',
  displayName: '',
};

export const SignupForm: React.FC<SignupFormProps> = (props) => {
  const { onSubmit, isLoading, isDisabled } = props;

  const handleSubmit = (data: SignupFormData) => onSubmit(data);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ isValid, values: { displayName } }) => (
        <Form noValidate>
          <VStack spacing={4} w="full">
            <StringField
              name="username"
              placeholder="Username"
              isDisabled={isDisabled || isLoading}
              isRequired
            />

            <HStack w="full">
              <StringField
                name="displayName"
                placeholder="Display name"
                isDisabled={isDisabled || isLoading}
              />
              <Box flexBasis="20%" maxW={14} pr={2}>
                <AvatarField name="avatar" displayName={displayName} />
              </Box>
            </HStack>

            <PasswordField
              name="password"
              placeholder="Enter password"
              isDisabled={isDisabled || isLoading}
              isRequired
            />

            <PasswordField
              name="passwordConfirm"
              placeholder="Confirm password"
              isDisabled={isDisabled || isLoading}
              isRequired
            />

            <HStack w="full" justify="flex-end">
              <Button
                type="submit"
                w={['full', 40]}
                mt={4}
                isDisabled={isDisabled || !isValid}
                isLoading={isLoading}
              >
                Signup
              </Button>
            </HStack>
          </VStack>
        </Form>
      )}
    </Formik>
  );
};
