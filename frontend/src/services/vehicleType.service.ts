import api from './api';

export interface VehicleType {
  id: number;
  name: string;
  description?: string;
  capacity: number;
  is_active?: boolean;
  price_factor?: number;
  created_at?: string;
  updated_at?: string;
}

const VehicleTypeService = {
  /**
   * Get all vehicle types
   * @returns Promise with array of vehicle types
   */
  getAllVehicleTypes: async (): Promise<VehicleType[]> => {
    try {
      const response = await api.get<VehicleType[]>('/admin/vehicle-types');
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle types:', error);
      throw error;
    }
  },

  /**
   * Get a specific vehicle type by ID
   * @param id Vehicle type ID
   * @returns Promise with vehicle type data
   */
  getVehicleTypeById: async (id: number): Promise<VehicleType> => {
    try {
      const response = await api.get<VehicleType>(`/admin/vehicle-types/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching vehicle type ${id}:`, error);
      throw error;
    }
  }
};

export default VehicleTypeService;

// For backward compatibility
export const vehicleTypeService = VehicleTypeService;
