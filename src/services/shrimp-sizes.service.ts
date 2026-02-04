import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface ShrimpType {
  id: number;
  name: string;
  scientificName: string;
  productionPercentage: number;
}

export interface PresentationType {
  id: number;
  code: string;
  name: string;
  rendimiento: number;
  lifeSpanDays: number;
  description?: string;
}

export interface ShrimpSize {
  id: number;
  shrimpTypeId: number;
  presentationTypeId: number;
  code: string;
  classification: string;
  minPiecesPerLb: number;
  maxPiecesPerLb: number;
  minWeightGrams: number;
  maxWeightGrams: number;
  minWeightOz: number;
  maxWeightOz: number;
  displayLabel: string;
  presentationType?: PresentationType;
  shrimpType?: ShrimpType;
}

export interface ShrimpSizeGrouped {
  presentation: PresentationType;
  sizes: ShrimpSize[];
}

export interface ConversionFactor {
  code: string;
  name: string;
  rendimiento: number;
  factor: number;
}

class ShrimpSizesService {
  async getShrimpTypes(): Promise<ShrimpType[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/shrimp-sizes/shrimp-types`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching shrimp types:', error);
      throw error;
    }
  }

  async getPresentationTypes(): Promise<PresentationType[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/shrimp-sizes/presentation-types`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching presentation types:', error);
      throw error;
    }
  }

  async getShrimpSizesByTypeAndPresentation(
    shrimpTypeId: number,
    presentationTypeId: number,
  ): Promise<ShrimpSize[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/shrimp-sizes/by-type-and-presentation/${shrimpTypeId}/${presentationTypeId}`,
        {
          headers: getAuthHeaders(),
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching shrimp sizes:', error);
      throw error;
    }
  }

  async getShrimpSizesByPresentation(presentationTypeId: number): Promise<ShrimpSize[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/shrimp-sizes/by-presentation/${presentationTypeId}`,
        {
          headers: getAuthHeaders(),
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching shrimp sizes by presentation:', error);
      throw error;
    }
  }

  async getShrimpSizesByType(shrimpTypeId: number): Promise<ShrimpSize[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/shrimp-sizes/by-type/${shrimpTypeId}`,
        {
          headers: getAuthHeaders(),
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching shrimp sizes by type:', error);
      throw error;
    }
  }

  async getShrimpSizesGroupedByPresentation(
    shrimpTypeId: number,
  ): Promise<ShrimpSizeGrouped[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/shrimp-sizes/grouped-by-presentation/${shrimpTypeId}`,
        {
          headers: getAuthHeaders(),
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching grouped shrimp sizes:', error);
      throw error;
    }
  }

  async getConversionFactors(shrimpTypeId: number): Promise<ConversionFactor[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/shrimp-sizes/conversion-factors/${shrimpTypeId}`,
        {
          headers: getAuthHeaders(),
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching conversion factors:', error);
      throw error;
    }
  }

  async getShrimpSize(id: number): Promise<ShrimpSize> {
    try {
      const response = await axios.get(`${API_BASE_URL}/shrimp-sizes/${id}`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching shrimp size:', error);
      throw error;
    }
  }
}

export default new ShrimpSizesService();
