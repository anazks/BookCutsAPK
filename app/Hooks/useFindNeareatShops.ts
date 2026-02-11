import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { findNearestShops } from '../api/Service/Shop';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface Shop {
  _id: string;
  ShopName: string;
  ExactLocation?: string;
  distance: number;
  City?: string;
  Timing?: string;
  Mobile?: string;
  website?: string;
  ProfileImage?: string;
  media?: Array<string | { url: string }>;
  [key: string]: any;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  radius?: number; // in meters
}

interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  itemsPerPage: number;
}

interface FindNearestShopsResponse {
  success: boolean;
  shops: Shop[];
  pagination?: PaginationMetadata;
  message?: string;
  [key: string]: any; // For any additional API response fields
}

interface UseFindNearestShopsReturn {
  shops: Shop[];
  loading: boolean;
  error: string | null;
  pagination: PaginationMetadata | null;
  findNearestShops: (
    coordinates: Coordinates,
    params?: PaginationParams
  ) => Promise<void>;
  loadMoreShops: () => Promise<void>;
  refreshShops: (coordinates: Coordinates) => Promise<void>;
  clearShops: () => void;
  clearError: () => void;
  resetPagination: () => void;
}

const useFindNearestShops = (
  defaultLimit: number = 10,
  defaultRadius: number = 10000
): UseFindNearestShopsReturn => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);

  const currentPage = useRef<number>(1);
  const currentCoordinates = useRef<Coordinates | null>(null);
  const isFetching = useRef<boolean>(false);
  const abortController = useRef<AbortController | null>(null);

  const validateCoordinates = (coordinates: Coordinates): boolean => {
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
      setError('Invalid coordinates: Latitude and longitude are required');
      return false;
    }

    if (
      coordinates.latitude === 0 &&
      coordinates.longitude === 0
    ) {
      setError('Invalid coordinates: Zero values not allowed');
      return false;
    }

    if (
      coordinates.latitude < -90 ||
      coordinates.latitude > 90 ||
      coordinates.longitude < -180 ||
      coordinates.longitude > 180
    ) {
      setError('Invalid coordinate values: Out of valid range');
      return false;
    }

    return true;
  };

  const findNearestShopsHandler = useCallback(
    async (
      coordinates: Coordinates,
      params?: PaginationParams
    ) => {
      // Cancel previous request if any
      if (abortController.current) {
        abortController.current.abort();
      }

      if (isFetching.current) return;
      
      const { page = 1, limit = defaultLimit, radius = defaultRadius } = params || {};

      if (!validateCoordinates(coordinates)) {
        return;
      }

      isFetching.current = true;
      currentCoordinates.current = coordinates;
      currentPage.current = page;

      // Create new AbortController for this request
      abortController.current = new AbortController();

      try {
        if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        // Call your API function with pagination parameters
        const result: FindNearestShopsResponse = await findNearestShops(
          coordinates,
          {
            page,
            limit,
            radius,
            signal: abortController.current.signal, // Pass abort signal if API supports it
          }
        );

        if (result?.success) {
          if (page === 1) {
            // First page - replace shops
            setShops(result.shops || []);
          } else {
            // Subsequent pages - append shops
            setShops((prevShops) => {
              // Filter out duplicates by _id
              const existingIds = new Set(prevShops.map(shop => shop._id));
              const newShops = (result.shops || []).filter(
                shop => !existingIds.has(shop._id)
              );
              return [...prevShops, ...newShops];
            });
          }

          // Update pagination metadata from API response
          if (result.pagination) {
            setPagination(result.pagination);
          } else {
            // If API doesn't provide pagination metadata, create a basic one
            // Note: This assumes the API returns all shops in the radius
            // You might need to adjust this based on your actual API behavior
            setPagination({
              currentPage: page,
              totalPages: Math.ceil((result.shops?.length || 0) / limit),
              totalItems: result.shops?.length || 0,
              hasNextPage: (result.shops?.length || 0) >= limit,
              hasPreviousPage: page > 1,
              itemsPerPage: limit,
            });
          }
        } else {
          const errorMessage = result?.message || 'Failed to fetch nearby shops.';
          setError(errorMessage);
          
          if (page === 1) {
            setShops([]);
          }
        }
      } catch (error: any) {
        // Handle abort errors separately
        if (error.name === 'AbortError') {
          console.log('Request was aborted');
          return;
        }

        console.error('Error fetching shops:', error);
        
        let errorMessage = 'Failed to load shops. Please try again.';
        
        if (error.message?.includes('network') || error.message?.includes('Network')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.message?.includes('timeout')) {
          errorMessage = 'Request timeout. Please try again.';
        } else if (error.status === 404) {
          errorMessage = 'No shops found in your area.';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        setError(errorMessage);
        
        if (page === 1) {
          setShops([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetching.current = false;
        abortController.current = null;
      }
    },
    [defaultLimit, defaultRadius]
  );

  const loadMoreShops = useCallback(async () => {
    if (
      !currentCoordinates.current ||
      isFetching.current ||
      loadingMore ||
      (pagination && !pagination.hasNextPage)
    ) {
      return;
    }

    const nextPage = (pagination?.currentPage || currentPage.current) + 1;
    
    await findNearestShopsHandler(
      currentCoordinates.current,
      {
        page: nextPage,
        limit: defaultLimit,
        radius: defaultRadius,
      }
    );
  }, [
    findNearestShopsHandler,
    pagination,
    loadingMore,
    defaultLimit,
    defaultRadius,
  ]);

  const refreshShops = useCallback(
    async (coordinates: Coordinates) => {
      if (!coordinates) return;
      
      await findNearestShopsHandler(coordinates, {
        page: 1,
        limit: defaultLimit,
        radius: defaultRadius,
      });
    },
    [findNearestShopsHandler, defaultLimit, defaultRadius]
  );

  const clearShops = useCallback(() => {
    setShops([]);
    setPagination(null);
    currentPage.current = 1;
    currentCoordinates.current = null;
    
    // Cancel any pending request
    if (abortController.current) {
      abortController.current.abort();
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetPagination = useCallback(() => {
    setPagination(null);
    currentPage.current = 1;
  }, []);

  return {
    shops,
    loading: loading || loadingMore,
    error,
    pagination,
    findNearestShops: findNearestShopsHandler,
    loadMoreShops,
    refreshShops,
    clearShops,
    clearError,
    resetPagination,
  };
};

export default useFindNearestShops;