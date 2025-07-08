import { TransExpressCity as LocationAPICity, TransExpressLocations } from './trans-express-locations';
import { TransExpressProvider } from './trans-express';

// Interface for local cities (fallback data structure)
export interface TransExpressCity {
    id: number;
    name: string;
    district: string;
}

// Fallback hardcoded cities if the API fails
export const FALLBACK_TRANS_EXPRESS_CITIES: TransExpressCity[] = [
    // Colombo
    { id: 864, name: "Colombo 01", district: "Colombo" },
    { id: 865, name: "Colombo 02", district: "Colombo" },
    { id: 866, name: "Colombo 03", district: "Colombo" },
    { id: 867, name: "Colombo 04", district: "Colombo" },
    { id: 868, name: "Colombo 05", district: "Colombo" },
    { id: 869, name: "Colombo 06", district: "Colombo" },
    { id: 870, name: "Colombo 07", district: "Colombo" },
    { id: 871, name: "Colombo 08", district: "Colombo" },
    { id: 872, name: "Colombo 09", district: "Colombo" },
    { id: 873, name: "Colombo 10", district: "Colombo" },
    { id: 874, name: "Colombo 11", district: "Colombo" },
    { id: 875, name: "Colombo 12", district: "Colombo" },
    { id: 876, name: "Colombo 13", district: "Colombo" },
    { id: 877, name: "Colombo 14", district: "Colombo" },
    { id: 878, name: "Colombo 15", district: "Colombo" },
    { id: 879, name: "Dehiwala", district: "Colombo" },
    { id: 880, name: "Mount Lavinia", district: "Colombo" },
    { id: 881, name: "Ratmalana", district: "Colombo" },
    { id: 882, name: "Moratuwa", district: "Colombo" },
    { id: 883, name: "Piliyandala", district: "Colombo" },
    { id: 884, name: "Maharagama", district: "Colombo" },
    { id: 885, name: "Nugegoda", district: "Colombo" },
    { id: 886, name: "Kolonnawa", district: "Colombo" },
    { id: 887, name: "Kotikawatta", district: "Colombo" },
    { id: 888, name: "Angoda", district: "Colombo" },
    { id: 889, name: "Athurugiriya", district: "Colombo" },
    { id: 890, name: "Battaramulla", district: "Colombo" },
    { id: 891, name: "Wellampitiya", district: "Colombo" },
    { id: 892, name: "Koswatta", district: "Colombo" },

    // Kandy
    { id: 901, name: "Kandy", district: "Kandy" },
    { id: 902, name: "Katugastota", district: "Kandy" },
    { id: 903, name: "Peradeniya", district: "Kandy" },
    { id: 904, name: "Gampola", district: "Kandy" },
    { id: 905, name: "Kundasale", district: "Kandy" },
    { id: 906, name: "Digana", district: "Kandy" },

    // Galle
    { id: 920, name: "Galle", district: "Galle" },
    { id: 921, name: "Hikkaduwa", district: "Galle" },
    { id: 922, name: "Ambalangoda", district: "Galle" },

    // Matara
    { id: 930, name: "Matara", district: "Matara" },
    { id: 931, name: "Weligama", district: "Matara" },

    // Jaffna
    { id: 940, name: "Jaffna", district: "Jaffna" },
    { id: 941, name: "Nallur", district: "Jaffna" },

    // Gampaha
    { id: 950, name: "Negombo", district: "Gampaha" },
    { id: 951, name: "Gampaha", district: "Gampaha" },
    { id: 952, name: "Kadawatha", district: "Gampaha" },
    { id: 953, name: "Kiribathgoda", district: "Gampaha" },
    { id: 954, name: "Wattala", district: "Gampaha" },
    { id: 955, name: "Ja-Ela", district: "Gampaha" },
    { id: 956, name: "Minuwangoda", district: "Gampaha" },

    // Badulla
    { id: 960, name: "Badulla", district: "Badulla" },
    { id: 961, name: "Bandarawela", district: "Badulla" },
    { id: 962, name: "Haputale", district: "Badulla" },

    // Hambantota
    { id: 970, name: "Hambantota", district: "Hambantota" },
    { id: 971, name: "Tangalle", district: "Hambantota" },

    // Kalutara
    { id: 980, name: "Kalutara", district: "Kalutara" },
    { id: 981, name: "Panadura", district: "Kalutara" },
    { id: 982, name: "Wadduwa", district: "Kalutara" },

    // Kurunegala
    { id: 990, name: "Kurunegala", district: "Kurunegala" },
    { id: 991, name: "Kuliyapitiya", district: "Kurunegala" },

    // Ampara
    { id: 1000, name: "Ampara", district: "Ampara" },
    { id: 1001, name: "Kalmunai", district: "Ampara" },

    // Anuradhapura
    { id: 1010, name: "Anuradhapura", district: "Anuradhapura" },
    { id: 1011, name: "Kekirawa", district: "Anuradhapura" },
];

// Cached data from API
let cachedCities: TransExpressCity[] | null = null;
let cachedDistricts: string[] | null = null;
let locationsAPIInstance: TransExpressLocations | null = null;

// Initialize the locations API
function getLocationsAPI() {
    if (!locationsAPIInstance) {
        const username = process.env.NEXT_PUBLIC_TRANS_EXPRESS_USERNAME || '';
        const password = process.env.NEXT_PUBLIC_TRANS_EXPRESS_PASSWORD || '';
        const transExpress = new TransExpressProvider(username, password);
        locationsAPIInstance = new TransExpressLocations(transExpress);
    }
    return locationsAPIInstance;
}

// Helper functions
export async function getCityNameById(cityId: number): Promise<string> {
    try {
        // Try to get city name from the API
        const locationsAPI = getLocationsAPI();
        return await locationsAPI.getCityNameById(cityId);
    } catch (error) {
        console.error('Failed to get city name from API, using fallback data:', error);
        // Fallback to hardcoded data
        const city = FALLBACK_TRANS_EXPRESS_CITIES.find(c => c.id === cityId);
        return city ? city.name : "Unknown City";
    }
}

export async function getDistrictByCityId(cityId: number): Promise<string> {
    try {
        // Try to get district from the API
        const locationsAPI = getLocationsAPI();
        const cities = await locationsAPI.getCities();
        const city = cities.find(c => c.id === cityId);

        if (city) {
            const districtName = await locationsAPI.getDistrictNameById(city.district_id);
            return districtName;
        }
        return "Unknown District";
    } catch (error) {
        console.error('Failed to get district from API, using fallback data:', error);
        // Fallback to hardcoded data
        const city = FALLBACK_TRANS_EXPRESS_CITIES.find(c => c.id === cityId);
        return city ? city.district : "Unknown District";
    }
}

export async function getCitiesByDistrict(district: string): Promise<TransExpressCity[]> {
    try {
        // Log the request
        console.log(`Getting cities for district: ${district}`);

        // If we have cached cities from API, use them
        if (cachedCities) {
            const matchingCities = cachedCities.filter(c => c.district.toLowerCase() === district.toLowerCase());
            console.log(`Found ${matchingCities.length} cached cities for district ${district}`);
            if (matchingCities.length > 0) {
                return matchingCities;
            }
        }

        // Try to get cities by district from the API
        const locationsAPI = getLocationsAPI();
        const apiDistricts = await locationsAPI.getDistricts();
        console.log(`Got ${apiDistricts.length} districts from API, looking for ${district}`);

        // Find the district in a case-insensitive way
        const matchingDistrict = apiDistricts.find(d => d.text.toLowerCase() === district.toLowerCase());

        if (matchingDistrict) {
            console.log(`Found matching district: ${matchingDistrict.text} with ID ${matchingDistrict.id}`);
            const apiCities = await locationsAPI.getCitiesByDistrictId(matchingDistrict.id);
            console.log(`Received ${apiCities.length} cities from API for district ID ${matchingDistrict.id}`);

            if (apiCities.length === 0) {
                console.warn(`No cities found for district ID ${matchingDistrict.id}, using fallback data`);
                const fallbackCities = FALLBACK_TRANS_EXPRESS_CITIES.filter(c =>
                    c.district.toLowerCase() === district.toLowerCase());
                console.log(`Found ${fallbackCities.length} fallback cities for district ${district}`);
                return fallbackCities;
            }

            // Convert API cities to our format
            const convertedCities: TransExpressCity[] = apiCities.map((city) => ({
                id: city.id,
                name: city.text, // API returns 'text' for city name
                district: district,
            }));

            // Cache the results
            if (!cachedCities) cachedCities = [];
            cachedCities.push(...convertedCities);

            return convertedCities;
        }

        console.warn(`District "${district}" not found in API response. Available districts:`,
            apiDistricts.slice(0, 5).map(d => d.text) + '...');
        throw new Error(`District "${district}" not found in API response`);
    } catch (error) {
        console.error('Failed to get cities by district from API, using fallback data:', error);
        // Fallback to hardcoded data - case-insensitive matching
        const fallbackCities = FALLBACK_TRANS_EXPRESS_CITIES.filter(c =>
            c.district.toLowerCase() === district.toLowerCase());
        console.log(`Found ${fallbackCities.length} fallback cities for district ${district}`);

        // If no fallback cities found for this district, use Colombo cities
        if (fallbackCities.length === 0) {
            console.warn(`No fallback cities found for district ${district}, using Colombo cities`);
            return FALLBACK_TRANS_EXPRESS_CITIES.filter(c => c.district === "Colombo").map(c => ({
                ...c,
                district: district // Set the district to the requested one
            }));
        }

        return fallbackCities;
    }
}

export async function getAllDistricts(): Promise<string[]> {
    try {
        // If we have cached districts, return them
        if (cachedDistricts) {
            console.log('Using cached districts:', cachedDistricts);
            return cachedDistricts;
        }

        console.log('Attempting to fetch districts from Trans Express API');
        // Try to get all districts from the API
        const locationsAPI = getLocationsAPI();
        const apiDistricts = await locationsAPI.getDistricts();

        if (!apiDistricts || apiDistricts.length === 0) {
            console.warn('API returned empty districts list, using fallback data');
            const fallbackDistricts = Array.from(new Set(FALLBACK_TRANS_EXPRESS_CITIES.map(city => city.district)));
            console.log('Fallback districts:', fallbackDistricts);
            cachedDistricts = fallbackDistricts;
            return fallbackDistricts;
        }

        console.log('API districts:', apiDistricts);
        const districtNames = apiDistricts.map(d => d.text); // Use 'text' property instead of 'name'
        console.log('Extracted district names:', districtNames);

        // Cache the results
        cachedDistricts = districtNames;
        return districtNames;
    } catch (error) {
        console.error('Failed to get all districts from API, using fallback data:', error);
        // Fallback to hardcoded data
        const fallbackDistricts = Array.from(new Set(FALLBACK_TRANS_EXPRESS_CITIES.map(city => city.district)));
        console.log('Fallback districts:', fallbackDistricts);
        // Cache the fallback results too
        cachedDistricts = fallbackDistricts;
        return fallbackDistricts;
    }
}

export async function getAllCities(): Promise<TransExpressCity[]> {
    try {
        // If we have cached cities, return them
        if (cachedCities) {
            return cachedCities;
        }

        // Try to get all cities from the API
        const locationsAPI = getLocationsAPI();
        const apiCities = await locationsAPI.getCities();

        // Convert API cities to our format
        const convertedCities: TransExpressCity[] = await Promise.all(
            apiCities.map(async (city) => {
                const district = await locationsAPI.getDistrictNameById(city.district_id || 0);
                return {
                    id: city.id,
                    name: city.text, // API returns 'text' for city name
                    district: district,
                };
            })
        );

        // Cache the results
        cachedCities = convertedCities;
        return convertedCities;
    } catch (error) {
        console.error('Failed to get all cities from API, using fallback data:', error);
        // Fallback to hardcoded data
        return FALLBACK_TRANS_EXPRESS_CITIES;
    }
} 