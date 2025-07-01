import { TransExpressProvider } from './trans-express';

export interface TransExpressProvince {
    id: number;
    name: string;
}

export interface TransExpressDistrict {
    id: number;
    text: string;
}

export interface TransExpressCity {
    id: number;
    text: string;
    district_id?: number;
}

export class TransExpressLocations {
    private transExpress: TransExpressProvider;
    private provinces: TransExpressProvince[] | null = null;
    private districts: TransExpressDistrict[] | null = null;
    private cities: TransExpressCity[] | null = null;

    private readonly PROVINCES_ENDPOINT = '/provinces';
    private readonly DISTRICTS_ENDPOINT = '/districts';
    private readonly CITIES_ENDPOINT = '/cities';

    constructor(transExpress: TransExpressProvider) {
        this.transExpress = transExpress;
    }

    /**
     * Fetch all provinces from Trans Express API
     */
    async getProvinces(): Promise<TransExpressProvince[]> {
        if (this.provinces) {
            return this.provinces;
        }

        try {
            const response = await this.transExpress.makeApiRequest(this.PROVINCES_ENDPOINT, 'GET');

            if (!response || !Array.isArray(response)) {
                throw new Error('Invalid response format from Trans Express Provinces API');
            }

            this.provinces = response;
            return this.provinces;
        } catch (error) {
            console.error('Failed to fetch provinces from Trans Express:', error);
            throw error;
        }
    }

    /**
     * Fetch all districts from Trans Express API
     */
    async getDistricts(): Promise<TransExpressDistrict[]> {
        if (this.districts) {
            return this.districts;
        }

        try {
            // The API returns all districts when no province_id is specified
            const response = await this.transExpress.makeApiRequest(this.DISTRICTS_ENDPOINT, 'GET');

            if (!response || !Array.isArray(response)) {
                throw new Error('Invalid response format from Trans Express Districts API');
            }

            console.log(`Received ${response.length} districts from API`);
            this.districts = response;
            return this.districts;
        } catch (error) {
            console.error('Failed to fetch districts from Trans Express:', error);
            throw error;
        }
    }

    /**
     * Fetch all cities from Trans Express API
     */
    async getCities(): Promise<TransExpressCity[]> {
        if (this.cities) {
            return this.cities;
        }

        try {
            // The API returns all cities when no district_id is specified
            const response = await this.transExpress.makeApiRequest(this.CITIES_ENDPOINT, 'GET');

            if (!response || !Array.isArray(response)) {
                throw new Error('Invalid response format from Trans Express Cities API');
            }

            this.cities = response;
            return this.cities;
        } catch (error) {
            console.error('Failed to fetch cities from Trans Express:', error);
            throw error;
        }
    }

    /**
     * Get districts by province ID
     */
    async getDistrictsByProvinceId(provinceId: number): Promise<TransExpressDistrict[]> {
        try {
            const queryParam = provinceId ? `?province_id=${provinceId}` : '';
            console.log(`Getting districts with query param: ${queryParam}`);
            const response = await this.transExpress.makeApiRequest(`${this.DISTRICTS_ENDPOINT}${queryParam}`, 'GET');
            if (!response || !Array.isArray(response)) {
                throw new Error('Invalid response format from Trans Express Districts API');
            }
            console.log(`Received ${response.length} districts for province ID ${provinceId}`);
            return response;
        } catch (error) {
            console.error(`Failed to fetch districts for province ${provinceId}:`, error);
            // Fallback to filtering the cached districts
            const districts = await this.getDistricts();
            return districts;
        }
    }

    /**
     * Get cities by district ID
     */
    async getCitiesByDistrictId(districtId: number): Promise<TransExpressCity[]> {
        try {
            console.log(`Fetching cities for district ID: ${districtId}`);
            // API endpoint expects district_id as parameter for filtering cities
            const response = await this.transExpress.makeApiRequest(`${this.CITIES_ENDPOINT}?district_id=${districtId}`, 'GET');
            if (!response || !Array.isArray(response)) {
                throw new Error('Invalid response format from Trans Express Cities API');
            }
            console.log(`Got ${response.length} cities for district ID ${districtId}`);
            return response;
        } catch (error) {
            console.error(`Failed to fetch cities for district ${districtId}:`, error);
            const cities = await this.getCities();
            return cities.filter(city => city.district_id === districtId);
        }
    }

    /**
     * Get city name by ID
     */
    async getCityNameById(cityId: number): Promise<string> {
        const cities = await this.getCities();
        const city = cities.find(city => city.id === cityId);
        return city ? city.text : 'Unknown City';
    }

    /**
     * Get district name by ID
     */
    async getDistrictNameById(districtId: number): Promise<string> {
        const districts = await this.getDistricts();
        const district = districts.find(district => district.id === districtId);
        return district ? district.text : 'Unknown District';
    }

    /**
     * Get province name by ID
     */
    async getProvinceNameById(provinceId: number): Promise<string> {
        const provinces = await this.getProvinces();
        const province = provinces.find(province => province.id === provinceId);
        return province ? province.name : 'Unknown Province';
    }
} 