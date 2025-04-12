import { useState } from 'react';
import { driverSchema, DriverFormValues } from '@/lib/validation-schemas';
import { useFormHandler } from '@/hooks/use-form-handler';
import FormField from '@/components/ui/form-field';
import BaseForm from '@/components/ui/base-form';
import { driverService } from '@/services/driver.service';

interface DriverFormProps {
  initialData?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    vehicleModel: string;
    licensePlate: string;
  };
  onSubmit: (data: DriverFormValues) => Promise<void>;
  onCancel: () => void;
}

const DriverForm = ({ initialData, onSubmit, onCancel }: DriverFormProps) => {
  const {
    form: { register, formState: { errors: formErrors } },
    isLoading,
    errors: apiErrors,
    success,
    handleSubmit,
    getFieldError,
  } = useFormHandler({
    schema: driverSchema,
    defaultValues: initialData,
    onSubmit,
  });

  // Combine form validation errors with API errors
  const getError = (fieldName: string) => {
    return formErrors[fieldName]?.message || getFieldError(fieldName);
  };

  return (
    <BaseForm
      title={initialData ? 'Edit Driver' : 'Add New Driver'}
      description={initialData ? 'Update driver information' : 'Enter driver details'}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isLoading={isLoading}
      errors={apiErrors}
      success={success}
      submitLabel={initialData ? 'Update Driver' : 'Add Driver'}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          id="name"
          name="name"
          label="Driver Name"
          placeholder="Enter driver name"
          error={getError('name')}
          register={register}
          required
        />

        <FormField
          id="email"
          name="email"
          label="Email"
          type="email"
          placeholder="Enter email address"
          error={getError('email')}
          register={register}
          required
        />

        <FormField
          id="phone"
          name="phone"
          label="Phone Number"
          placeholder="Enter phone number"
          error={getError('phone')}
          register={register}
          required
        />

        <FormField
          id="vehicleModel"
          name="vehicleModel"
          label="Vehicle Model"
          placeholder="Enter vehicle model"
          error={getError('vehicleModel')}
          register={register}
          required
        />

        <FormField
          id="licensePlate"
          name="licensePlate"
          label="License Plate"
          placeholder="Enter license plate number"
          error={getError('licensePlate')}
          register={register}
          required
        />
      </div>
    </BaseForm>
  );
};

export default DriverForm; 