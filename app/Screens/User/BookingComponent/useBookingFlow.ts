// hooks/useBookingFlow.ts
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  fetchAllAvailableTimeSlots,
  getBarberFreeTime,
  getdiscount,
  SlotBooking,
} from '../../../api/Service/Booking';
import { getmyBarbers, getShopById, getShopServices } from '../../../api/Service/Shop';
import { getmyProfile } from '../../../api/Service/User';

// ── Types (expand as needed) ──
type Service = {
  id: string | null;
  name: string;
  price: number;
  duration: number;
};

type Barber = {
  id: string | null;
  name: string;
  nativePlace?: string;
};

type Shop = {
  id: string;
  name: string;
  address: string;
  openingTime: string;
  closingTime: string;
  services: Service[];
  barbers: Barber[];
  Timing: string;
};

type ScheduleData = {
  workHours: { from: string; to: string };
  breaks: Array<{ startTime: string; endTime: string }>;
  bookings: Array<{ startTime: string; endTime: string }>;
  freeSlots: Array<{ from: string; to: string; minutes?: number }>;
};

type PriceDetails = {
  baseTotal: number;
  discountAmount: number;
  finalTotal: number;
  hasDiscount: boolean;
};

// ── Helper functions (moved here for reusability) ──
const parseTime = (timeStr: string): string => {
  timeStr = timeStr.trim().toLowerCase();
  const match = timeStr.match(/(\d+)([ap]m)/);
  if (!match) return '09:00';
  let hour = parseInt(match[1], 10);
  const modifier = match[2];
  if (modifier === 'pm' && hour !== 12) hour += 12;
  if (modifier === 'am' && hour === 12) hour = 0;
  return `${hour.toString().padStart(2, '0')}:00`;
};

const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const addMinutesToTime = (timeStr: string, minutesToAdd: number): string => {
  const totalMin = timeToMinutes(timeStr) + minutesToAdd;
  return minutesToTime(totalMin);
};

const formatLocalDate = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const useBookingFlow = () => {
  const { shop_id } = useLocalSearchParams<{ shop_id: string }>();

  // ── Core states ──
  const [shopDetails, setShopDetails] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getmyProfile();
        if (response?.success && response?.user?._id) {
          setLoggedInUserId(response.user._id);
        }
      } catch (err) {
        console.warn('Failed to fetch user profile for booking:', err);
      }
    };
    fetchUser();
  }, []);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const [discountInfo, setDiscountInfo] = useState<any>(null);
  const [loadingDiscount, setLoadingDiscount] = useState(false);

  const [freeGaps, setFreeGaps] = useState<ScheduleData>({
    workHours: { from: '09:00', to: '21:00' },
    breaks: [],
    bookings: [],
    freeSlots: [],
  });
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [apiErrors, setApiErrors] = useState({ services: false, barbers: false });

  // ── Computed values ──
  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + (s.duration || 30), 0),
    [selectedServices]
  );

  const priceDetails = useMemo<PriceDetails>(() => {
    const base = selectedServices.reduce((sum, s) => sum + ((s.price || 0) + 20), 0);
    const discount = discountInfo?.referralDiscount || 0;
    return {
      baseTotal: base,
      discountAmount: discount,
      finalTotal: base - discount,
      hasDiscount: discount > 0,
    };
  }, [selectedServices, discountInfo]);

  const { baseTotal, discountAmount, finalTotal, hasDiscount } = priceDetails;

  const barberOptions = useMemo<Barber[]>(() => {
    if (!shopDetails?.barbers) return [{ id: null, name: 'Any Barber' }];
    return [{ id: null, name: 'Any Barber' }, ...shopDetails.barbers];
  }, [shopDetails?.barbers]);

  const allServices = useMemo<Service[]>(() => {
    if (!shopDetails?.services) return [];
    return [{ id: null, name: 'hair cut', price: 150, duration: 30 }, ...shopDetails.services];
  }, [shopDetails?.services]);

  // ── Handlers ──
  const toggleService = useCallback((service: Service) => {
    setSelectedServices((prev) =>
      prev.some((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service]
    );
  }, []);

  const handleBarberSelect = useCallback((barber: Barber) => {
    setSelectedBarber(barber);
    setSelectedStartTime(null); // reset time when barber changes
  }, []);

  const validateBooking = useCallback((): string | null => {
    if (selectedServices.length === 0) return 'Please select at least one service';
    if (!selectedDate) return 'Please select a date';
    if (!selectedBarber) return 'Please select a barber';
    if (!selectedStartTime) return 'Please select a time slot';
    if (!loggedInUserId) return 'Checking user session, please wait...';
    return null;
  }, [selectedServices, selectedDate, selectedBarber, selectedStartTime, loggedInUserId]);

  const handleBookNow = useCallback(() => {
    const validationError = validateBooking();
    if (validationError) {
      Alert.alert('Incomplete Booking', validationError);
      return;
    }
    setShowConfirmation(true);
  }, [validateBooking]);

  const prepareBookingData = useCallback(() => {
    if (!selectedDate || !selectedStartTime) return null;

    const bookingDateStr = formatLocalDate(selectedDate);
    const startTimeStr = selectedStartTime;
    const endTimeStr = addMinutesToTime(startTimeStr, totalDuration);

    const startingTime = new Date(`${bookingDateStr}T${startTimeStr}:00`).toISOString();
    const endingTime = new Date(`${bookingDateStr}T${endTimeStr}:00`).toISOString();

    const serviceIds = selectedServices.map((s) => s.id).filter(Boolean);

    const advanceAmount = Math.min(20, finalTotal * 0.2);
    const remainingAmount = finalTotal - advanceAmount;

    return {
      barberId: selectedBarber?.id || null,
      userId: loggedInUserId,
      shopId: shopDetails?.id || null,
      serviceIds: serviceIds.length > 0 ? serviceIds : null,
      services: selectedServices.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        duration: s.duration,
      })),
      bookingDate: bookingDateStr,
      timeSlot: { startingTime, endingTime },
      totalPrice: finalTotal,
      basePrice: baseTotal,
      discountApplied: discountAmount,
      totalDuration,
      paymentType: 'advance',
      amountToPay: advanceAmount,
      remainingAmount,
      currency: 'INR',
      bookingStatus: 'pending',
      paymentId: null,
      paymentStatus: 'unpaid',
      amountPaid: 0,
    };
  }, [
    selectedDate,
    selectedStartTime,
    totalDuration,
    finalTotal,
    selectedBarber,
    shopDetails,
    selectedServices,
    baseTotal,
    discountAmount,
    loggedInUserId,
  ]);

  const confirmBooking = useCallback(async () => {
    setShowConfirmation(false);
    setIsBooking(true);

    try {
      const bookingData = prepareBookingData();
      if (!bookingData) throw new Error('Invalid booking data');

      const response = await SlotBooking(bookingData);

      if (response.success) {
        const bookingId = response.BookingStatus?._id;
        const endTimeStr = addMinutesToTime(selectedStartTime!, totalDuration);

        Alert.alert(
          '🎉 Booking Confirmation!',
          `Your appointment with ${selectedBarber?.name || 'Any Barber'} is confirmed for ${selectedDate?.toDateString()} at ${selectedStartTime} - ${endTimeStr}`,
          [
            {
              text: 'Continue to Payment',
              onPress: () => {
                router.push({
                  pathname: '/Screens/User/PayNow',
                  params: {
                    bookingData: JSON.stringify(bookingData),
                    bookingId,
                    advanceAmount: Math.min(20, finalTotal),
                    totalPrice: finalTotal,
                    barberName: selectedBarber?.name || 'Any Barber',
                    bookingDate: selectedDate?.toLocaleDateString(),
                    timeSlot: `${selectedStartTime} - ${endTimeStr}`,
                  },
                });
              },
            },
          ]
        );

        // Reset form
        setSelectedServices([]);
        setSelectedDate(null);
        setSelectedBarber(null);
        setSelectedStartTime(null);
        setFreeGaps({
          workHours: { from: '09:00', to: '21:00' },
          breaks: [],
          bookings: [],
          freeSlots: [],
        });
      } else {
        throw new Error(response.message || 'Booking failed');
      }
    } catch (err: any) {
      Alert.alert('Booking Error', err.message || 'Failed to complete booking.');
    } finally {
      setIsBooking(false);
    }
  }, [prepareBookingData, selectedBarber, selectedDate, selectedStartTime, totalDuration, finalTotal]);

  // ── Fetch discount eligibility ──
  useEffect(() => {
    const fetchDiscountStatus = async () => {
      setLoadingDiscount(true);
      try {
        const response = await getdiscount();
        if (response?.success) {
          setDiscountInfo(response);
        }
      } catch (err) {
        console.error('Error fetching discount:', err);
        setDiscountInfo({ success: true, referralDiscount: 0 });
      } finally {
        setLoadingDiscount(false);
      }
    };
    fetchDiscountStatus();
  }, []);

  // ── Fetch shop data ──
  useEffect(() => {
    if (!shop_id) {
      setError('No shop ID provided');
      setLoading(false);
      return;
    }

    const fetchShopData = async () => {
      setLoading(true);
      setError(null);
      setApiErrors({ services: false, barbers: false });

      try {
        const shopResponse = await getShopById(shop_id);
        if (!shopResponse?.success || !shopResponse.data?.[0]) {
          throw new Error(shopResponse?.message || 'Failed to load shop');
        }

        const shopData = shopResponse.data[0];
        const times = (shopData.Timing || '').split('-').map((t: string) => t.trim()).filter(Boolean);
        const openingTime = times[0] ? parseTime(times[0]) : '09:00';
        const closingTime = times[1] ? parseTime(times[1]) : '21:00';

        let services: Service[] = [];
        let barbers: Barber[] = [];

        try {
          const servicesResponse = await getShopServices(shop_id);
          if (servicesResponse?.success) {
            services = servicesResponse.data.map((service: any) => ({
              id: service._id,
              name: service.ServiceName,
              price: parseInt(service.Rate, 10) || 0,
              duration: service.duration || 30,
            }));
          } else {
            setApiErrors((prev) => ({ ...prev, services: true }));
          }
        } catch {
          setApiErrors((prev) => ({ ...prev, services: true }));
        }

        try {
          const barbersResponse = await getmyBarbers(shop_id);
          if (barbersResponse?.success) {
            barbers = barbersResponse.data.map((barber: any) => ({
              id: barber._id,
              name: barber.BarberName,
              nativePlace: barber.From,
            }));
          } else {
            setApiErrors((prev) => ({ ...prev, barbers: true }));
          }
        } catch {
          setApiErrors((prev) => ({ ...prev, barbers: true }));
        }

        setShopDetails({
          id: shopData._id,
          name: shopData.ShopName,
          address: `${shopData.City || ''} • ${shopData.Mobile || ''}`,
          openingTime,
          closingTime,
          services,
          barbers,
          Timing: shopData.Timing,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load shop details');
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [shop_id]);

  // ── Fetch barber-specific or any-barber slots when date or barber changes ──
  const fetchFreeTimes = useCallback(async () => {
    if (!selectedDate || !selectedBarber?.id || !shop_id) {
      setFreeGaps({ workHours: { from: '09:00', to: '21:00' }, breaks: [], bookings: [], freeSlots: [] });
      return;
    }

    const dateStr = formatLocalDate(selectedDate);
    setLoadingSlots(true);

    try {
      const response = await getBarberFreeTime(selectedBarber.id, dateStr, shop_id);
      if (response?.success && response?.availableHours?.success) {
        const apiSchedule = response.availableHours.schedule;
        const schedule: ScheduleData = {
          workHours: {
            from: apiSchedule.workHours?.from || '09:00',
            to: apiSchedule.workHours?.to || '21:00',
          },
          breaks: (apiSchedule.breaks || []).map((b: any) => ({
            startTime: b.startTime,
            endTime: b.endTime,
          })),
          bookings: (apiSchedule.bookings || [])
            .filter((b: any) => b.bookingStatus === 'confirmed' || b.status === 'confirmed')
            .map((b: any) => ({
              startTime: b.startTime,
              endTime: b.endTime,
            })),
          freeSlots: (apiSchedule.freeSlots || []).map((slot: any) => ({
            from: slot.from,
            to: slot.to,
            minutes: slot.minutes || timeToMinutes(slot.to) - timeToMinutes(slot.from),
          })),
        };

        setFreeGaps(schedule);

        if (schedule.freeSlots.length > 0) {
          setSelectedStartTime(prev => prev || schedule.freeSlots[0].from);
        } else {
          setSelectedStartTime(null);
        }
      } else {
        setFreeGaps({ workHours: { from: '09:00', to: '21:00' }, breaks: [], bookings: [], freeSlots: [] });
        setSelectedStartTime(null);
      }
    } catch (err) {
      console.error('Error fetching barber schedule:', err);
      setFreeGaps({ workHours: { from: '09:00', to: '21:00' }, breaks: [], bookings: [], freeSlots: [] });
      setSelectedStartTime(null);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate, selectedBarber?.id, shop_id]);

  const fetchAllSlots = useCallback(async () => {
    if (!selectedDate || selectedBarber?.id !== null || !shop_id) {
      setFreeGaps({ workHours: { from: '09:00', to: '21:00' }, breaks: [], bookings: [], freeSlots: [] });
      setLoadingSlots(false);
      return;
    }

    setLoadingSlots(true);
    const dateStr = formatLocalDate(selectedDate);

    try {
      const response = await fetchAllAvailableTimeSlots(shop_id, dateStr);
      if (response?.success && response?.availableSlots?.success) {
        const freeSlots = response.availableSlots.schedule?.freeSlots || [];
        setFreeGaps({
          workHours: { from: '09:00', to: '21:00' },
          breaks: [],
          bookings: [],
          freeSlots: freeSlots.map((slot: any) => ({
            from: slot.from,
            to: slot.to,
            minutes: slot.minutes,
          })),
        });

        const startTimes = freeSlots
          .map((slot: any) => slot.from)
          .sort((a: string, b: string) => timeToMinutes(a) - timeToMinutes(b));

        if (startTimes.length > 0) {
          setSelectedStartTime(prev => prev || startTimes[0]);
        } else {
          setSelectedStartTime(null);
        }
      } else {
        setFreeGaps({ workHours: { from: '09:00', to: '21:00' }, breaks: [], bookings: [], freeSlots: [] });
        setSelectedStartTime(null);
      }
    } catch (err) {
      console.error('Error fetching all slots:', err);
      setFreeGaps({ workHours: { from: '09:00', to: '21:00' }, breaks: [], bookings: [], freeSlots: [] });
      setSelectedStartTime(null);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate, selectedBarber?.id, shop_id]);

  // Auto-fetch slots when date or barber changes
  useEffect(() => {
    if (!selectedDate) {
      setFreeGaps({ workHours: { from: '09:00', to: '21:00' }, breaks: [], bookings: [], freeSlots: [] });
      setSelectedStartTime(null);
      return;
    }

    if (selectedBarber?.id) {
      fetchFreeTimes();
    } else if (selectedBarber?.id === null) {
      fetchAllSlots();
    }
  }, [selectedDate, selectedBarber?.id, fetchFreeTimes, fetchAllSlots]);

  // Return everything the component needs
  return {
    shopDetails,
    loading,
    error,
    apiErrors,
    allServices,
    barberOptions,
    selectedServices,
    toggleService,
    selectedDate,
    setSelectedDate,
    selectedBarber,
    handleBarberSelect,
    selectedStartTime,
    setSelectedStartTime,
    freeGaps,
    loadingSlots,
    totalDuration,
    priceDetails,
    showConfirmation,
    setShowConfirmation,
    isBooking,
    setIsBooking,
    handleBookNow,
    confirmBooking,
    prepareBookingData,
  };
};