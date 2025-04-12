import { useState } from 'react';
import { hubSchema, HubFormValues } from '@/lib/validation-schemas';
import { useFormHandler } from '@/hooks/use-form-handler';
import FormField from '@/components/ui/form-field';
import BaseForm from '@/components/ui/base-form';
import { hubService } from '@/services/hub.service'; // eslint-disable-line @typescript-eslint/no-unused-vars

interface HubFormProps {
  initialData?: {
    id: string;
    name: string;
    location: string;
    capacity: number;
    facilities: string[];
    status: 'active' | 'maintenance' | 'inactive';
  };
  onSubmit: (data: HubFormValues) => Promise<void>;
  onCancel: () => void;
}

const HubForm = ({ initialData, onSubmit, onCancel }: HubFormProps) => {
  const [facilities, setFacilities] = useState<string[]>(initialData?.facilities || []);

  const {
    form: { register, setValue, formState: { errors: formErrors } },
    isLoading,
    errors: apiErrors,
    success,
    handleSubmit,
    getFieldError,
  } = useFormHandler({
    schema: hubSchema,
    defaultValues: initialData,
    onSubmit: async (data) => {
      await onSubmit({ ...data, facilities });
    },
  });

  // Combine form validation errors with API errors
  const getError = (fieldName: string) => {
    return formErrors[fieldName]?.message || getFieldError(fieldName);
  };

  const handleFacilityChange = (value: string) => {
    const newFacilities = facilities.includes(value)
      ? facilities.filter(f => f !== value)
      : [...facilities, value];
    setFacilities(newFacilities);
    setValue('facilities', newFacilities);
  };

  const facilityOptions = [
    { value: 'Parking', label: 'Parking' },
    { value: 'Charging', label: 'Charging' },
    { value: 'Restroom', label: 'Restroom' },
    { value: 'Waiting Area', label: 'Waiting Area' },
    { value: 'Security', label: 'Security' },
    { value: 'WiFi', label: 'WiFi' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'inactive', label: 'Inactive' },
  ];

  return (
    <BaseForm
      title={initialData ? 'Edit Hub' : 'Add New Hub'}
      description={initialData ? 'Update hub information' : 'Enter hub details'}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isLoading={isLoading}
      errors={apiErrors}
      success={success}
      submitLabel={initialData ? 'Update Hub' : 'Add Hub'}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          id="name"
          name="name"
          label="Hub Name"
          placeholder="Enter hub name"
          error={getError('name')}
          register={register}
          required
        />

        <FormField
          id="location"
          name="location"
          label="Location"
          placeholder="Enter hub location"
          error={getError('location')}
          register={register}
          required
        />

        <FormField
          id="capacity"
          name="capacity"
          label="Capacity"
          type="number"
          placeholder="Enter hub capacity"
          error={getError('capacity')}
          register={register}
          required
          min={1}
        />

        <FormField
          id="status"
          name="status"
          label="Status"
          type="select"
          placeholder="Select status"
          error={getError('status')}
          options={statusOptions}
          value={initialData?.status || 'active'}
          onChange={(value) => setValue('status', value as 'active' | 'maintenance' | 'inactive')}
          required
        />
      </div>

      <div className="space-y-2 mt-4">
        <label className="text-sm font-medium">Facilities</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {facilityOptions.map((facility) => (
            <div key={facility.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={facility.value}
                checked={facilities.includes(facility.value)}
                onChange={() => handleFacilityChange(facility.value)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor={facility.value} className="text-sm">
                {facility.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </BaseForm>
  );
};

export default HubForm;