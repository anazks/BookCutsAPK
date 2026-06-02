import { configureStore } from '@reduxjs/toolkit';
import shopsReducer from './shopsSlice';
import bookingPrefetchReducer from './bookingPrefetchSlice';

export const store = configureStore({
  reducer: {
    shops: shopsReducer,
    bookingPrefetch: bookingPrefetchReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Turn off serialization check for location objects
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
