export interface AvailabilitySlot {
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  start: string; // '09:00'
  end: string;   // '17:00'
}

export interface AvailableDoctor {
  id: number;
  first_name: string;
  last_name: string;
  specialization?: string;
  availability_slot: AvailabilitySlot;
  free_slots: number;
  booked_slots_count: number;
}

export interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  specialization?: string;
}

export interface DoctorAvailabilityResponse {
  doctor: Doctor;
  slots: Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', AvailabilitySlot>;
  availableDates: string[];
  availableTimes: string[];
}

