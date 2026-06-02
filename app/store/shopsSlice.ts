import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getAllShops } from '../api/Service/Shop';

// Transform function from BookNow.tsx to make API data UI-ready
export const transformShopData = (apiData: any[]) => {
  return apiData.map((shop: any, index: number) => {
    const shopName = shop.ShopName || `${shop.firstName} ${shop.lastName}` || 'Unknown Shop';
    const city = shop.City || shop.city || 'Unknown City';
    const mobile = shop.Mobile || shop.mobileNo || 'N/A';
    const timing = shop.Timing || '9:00 AM - 8:00 PM';
    const website = shop.website || '';

    return {
      id: shop._id,
      name: shopName,
      city: city,
      mobile: mobile,
      timing: timing,
      website: website,
      price: '₹500-1500',
      coordinates: shop.ExactLocationCoord ? shop.ExactLocationCoord.coordinates : null,
      image: shop.ProfileImage || `https://images.unsplash.com/photo-${1580618672591 + index}-eb180b1a973f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60`,
      isOpen: Math.random() > 0.3,
      serviceType: ['Haircut', 'Beard Trim', 'Facial', 'Massage', 'Hair Color'][Math.floor(Math.random() * 5)],
      distanceText: shop.distanceText,
      distanceKm: shop.distance,
    };
  });
};

export interface FetchShopsArgs {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
  city?: string;
  lat?: number;
  lng?: number;
  isSilent?: boolean; // If true, does not trigger a full-screen loading spinner
}

export const fetchShopsThunk = createAsyncThunk(
  'shops/fetchShops',
  async (args: FetchShopsArgs, { rejectWithValue }) => {
    try {
      const { isSilent, ...apiParams } = args;
      const response = await getAllShops(apiParams);
      if (response && response.success) {
        return {
          data: response.data ? transformShopData(response.data) : [],
          cities: response.cities || [],
          pagination: response.pagination || null,
          page: args.page,
        };
      } else {
        return rejectWithValue(response.message || 'Failed to fetch shops');
      }
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch shops');
    }
  }
);

interface ShopsState {
  allShops: any[];
  citiesList: string[];
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  page: number;
  isPrefetched: boolean;
}

const initialState: ShopsState = {
  allShops: [],
  citiesList: ['All'],
  hasMore: true,
  loading: false,
  loadingMore: false,
  error: null,
  page: 1,
  isPrefetched: false,
};

const shopsSlice = createSlice({
  name: 'shops',
  initialState,
  reducers: {
    clearShopsError: (state) => {
      state.error = null;
    },
    resetShopsState: (state) => {
      return {
        ...initialState,
        citiesList: state.citiesList, // Preserve loaded cities list
      };
    },
    setPrefetchedData: (state, action: PayloadAction<{ allShops: any[]; citiesList: string[]; hasMore: boolean }>) => {
      state.allShops = action.payload.allShops;
      state.citiesList = action.payload.citiesList;
      state.hasMore = action.payload.hasMore;
      state.isPrefetched = true;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShopsThunk.pending, (state, action) => {
        const isPageOne = action.meta.arg.page === 1;
        const isSilent = action.meta.arg.isSilent;
        if (isPageOne) {
          if (!isSilent) {
            state.loading = true;
          }
        } else {
          state.loadingMore = true;
        }
        state.error = null;
      })
      .addCase(fetchShopsThunk.fulfilled, (state, action) => {
        const { data, cities, pagination, page } = action.payload;
        if (page === 1) {
          state.allShops = data;
          state.isPrefetched = true;
        } else {
          // Filter duplicates just in case
          const existingIds = new Set(state.allShops.map(s => s.id));
          const newUniqueData = data.filter((s: any) => !existingIds.has(s.id));
          state.allShops = [...state.allShops, ...newUniqueData];
        }

        if (cities && cities.length > 0) {
          state.citiesList = ['All', ...cities];
        }

        if (pagination) {
          state.hasMore = pagination.hasNextPage;
        } else {
          state.hasMore = data.length === 10;
        }

        state.page = page;
        state.loading = false;
        state.loadingMore = false;
      })
      .addCase(fetchShopsThunk.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        const isPageOne = action.meta.arg.page === 1;
        // Only set page error if we don't already have data cached
        if (isPageOne && state.allShops.length === 0) {
          state.error = action.payload as string || 'An error occurred';
        }
      });
  },
});

export const { clearShopsError, resetShopsState, setPrefetchedData } = shopsSlice.actions;
export default shopsSlice.reducer;
