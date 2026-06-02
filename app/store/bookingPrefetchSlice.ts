import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getShopServices, getmyBarbers, getShopById, getShopOffers } from '../api/Service/Shop';
import { fetchAllAvailableTimeSlots, myBookings } from '../api/Service/Booking';

// Async thunk to prefetch services and barbers for a specific shop
export const prefetchServicesAndBarbers = createAsyncThunk(
  'bookingPrefetch/servicesAndBarbers',
  async (shopId: string, { rejectWithValue }) => {
    try {
      const [servicesResponse, barbersResponse, shopResponse, offersResponse] = await Promise.all([
        getShopServices(shopId),
        getmyBarbers(shopId),
        getShopById(shopId),
        getShopOffers(shopId).catch(() => ({ success: true, data: [] })) // Fallback for offers if it fails
      ]);

      return {
        shopId,
        services: servicesResponse?.success && Array.isArray(servicesResponse.data) ? servicesResponse.data : [],
        barbers: barbersResponse?.success && Array.isArray(barbersResponse.data) ? barbersResponse.data : [],
        details: shopResponse?.success && shopResponse.data && shopResponse.data.length > 0 ? shopResponse.data[0] : null,
        offers: offersResponse?.success && Array.isArray(offersResponse.data) ? offersResponse.data : []
      };
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to prefetch services and barbers');
    }
  }
);

// Async thunk to prefetch slots for a specific shop across multiple dates (usually today & tomorrow)
export const prefetchSlotsForDates = createAsyncThunk(
  'bookingPrefetch/slotsForDates',
  async ({ shopId, dates }: { shopId: string; dates: string[] }, { rejectWithValue }) => {
    try {
      const slotRequests = dates.map(async (date) => {
        try {
          const response = await fetchAllAvailableTimeSlots(shopId, date);
          const freeSlots = response?.success && response?.availableSlots?.schedule?.freeSlots 
            ? response.availableSlots.schedule.freeSlots 
            : [];
          return { date, slots: freeSlots };
        } catch (err) {
          console.warn(`Failed to prefetch slots for shop ${shopId} on date ${date}:`, err);
          return { date, slots: [] };
        }
      });

      const results = await Promise.all(slotRequests);
      return { shopId, results };
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to prefetch slots');
    }
  }
);

// Async thunk to prefetch the user's booking history
export const prefetchBookings = createAsyncThunk(
  'bookingPrefetch/bookings',
  async (params: { limit?: number; lastDate?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await myBookings(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to prefetch bookings');
    }
  }
);

export interface PrefetchedShopData {
  services: any[];
  barbers: any[];
  details: any | null;
  offers: any[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;
}

export interface PrefetchedSlotData {
  slots: any[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;
}

export interface PrefetchedBookingsData {
  bookings: any[];
  nextCursor: string | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number;
}

interface BookingPrefetchState {
  servicesAndBarbers: Record<string, PrefetchedShopData>;
  slotsCache: Record<string, PrefetchedSlotData>; // Key: `${shopId}_${date}`
  bookings: PrefetchedBookingsData;
}

const initialState: BookingPrefetchState = {
  servicesAndBarbers: {},
  slotsCache: {},
  bookings: {
    bookings: [],
    nextCursor: null,
    loading: false,
    error: null,
    lastUpdated: 0
  }
};

const bookingPrefetchSlice = createSlice({
  name: 'bookingPrefetch',
  initialState,
  reducers: {
    clearPrefetchCache: (state) => {
      state.servicesAndBarbers = {};
      state.slotsCache = {};
      state.bookings = {
        bookings: [],
        nextCursor: null,
        loading: false,
        error: null,
        lastUpdated: 0
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // prefetchServicesAndBarbers
      .addCase(prefetchServicesAndBarbers.pending, (state, action) => {
        const shopId = action.meta.arg;
        if (!state.servicesAndBarbers[shopId]) {
          state.servicesAndBarbers[shopId] = {
            services: [],
            barbers: [],
            details: null,
            offers: [],
            loading: true,
            error: null,
            lastUpdated: 0
          };
        }
      })
      .addCase(prefetchServicesAndBarbers.fulfilled, (state, action) => {
        const { shopId, services, barbers, details, offers } = action.payload;
        state.servicesAndBarbers[shopId] = {
          services,
          barbers,
          details,
          offers,
          loading: false,
          error: null,
          lastUpdated: Date.now()
        };
      })
      .addCase(prefetchServicesAndBarbers.rejected, (state, action) => {
        const shopId = action.meta.arg;
        if (state.servicesAndBarbers[shopId]) {
          state.servicesAndBarbers[shopId].loading = false;
          state.servicesAndBarbers[shopId].error = action.payload as string || 'Prefetch failed';
        }
      })

      // prefetchSlotsForDates
      .addCase(prefetchSlotsForDates.pending, (state, action) => {
        const { shopId, dates } = action.meta.arg;
        dates.forEach((date) => {
          const cacheKey = `${shopId}_${date}`;
          if (!state.slotsCache[cacheKey]) {
            state.slotsCache[cacheKey] = {
              slots: [],
              loading: true,
              error: null,
              lastUpdated: 0
            };
          }
        });
      })
      .addCase(prefetchSlotsForDates.fulfilled, (state, action) => {
        const { shopId, results } = action.payload;
        results.forEach(({ date, slots }) => {
          const cacheKey = `${shopId}_${date}`;
          state.slotsCache[cacheKey] = {
            slots,
            loading: false,
            error: null,
            lastUpdated: Date.now()
          };
        });
      })
      .addCase(prefetchSlotsForDates.rejected, (state, action) => {
        const { shopId, dates } = action.meta.arg;
        dates.forEach((date) => {
          const cacheKey = `${shopId}_${date}`;
          if (state.slotsCache[cacheKey]) {
            state.slotsCache[cacheKey].loading = false;
            state.slotsCache[cacheKey].error = action.payload as string || 'Prefetch failed';
          }
        });
      })

      // prefetchBookings
      .addCase(prefetchBookings.pending, (state) => {
        state.bookings.loading = true;
        state.bookings.error = null;
      })
      .addCase(prefetchBookings.fulfilled, (state, action) => {
        const { bookings, nextCursor } = action.payload;
        state.bookings = {
          bookings: bookings || [],
          nextCursor: nextCursor || null,
          loading: false,
          error: null,
          lastUpdated: Date.now()
        };
      })
      .addCase(prefetchBookings.rejected, (state, action) => {
        state.bookings.loading = false;
        state.bookings.error = action.payload as string || 'Prefetch bookings failed';
      });
  }
});

export const { clearPrefetchCache } = bookingPrefetchSlice.actions;
export default bookingPrefetchSlice.reducer;
