import { create } from 'zustand';

export interface TicketSelection {
  ticketTypeId: string;
  name: string;
  price: number;
  quantity: number;
  perks: string[];
}

export interface SectionSelection {
  sectionId: string;
  sectionName: string;
  priceModifier: number;
  row?: string;
  seatNumbers?: string[];
}

export interface BundleSelection {
  bundleId: string;
  name: string;
  price: number;
  selectedSize: string;
  items: string[];
}

export interface TicketCartState {
  // Current step (1-5)
  currentStep: number;
  
  // Show info
  showId: string | null;
  showVenue: string | null;
  showDate: string | null;
  showCity: string | null;
  
  // Selections
  tickets: TicketSelection[];
  section: SectionSelection | null;
  bundles: BundleSelection[];
  
  // Fees
  ticketSubtotal: number;
  bundleSubtotal: number;
  ticketmasterFees: number;
  portalConvenienceFee: number;
  total: number;
  
  // Customer info
  customerEmail: string;
  customerName: string;
  
  // Order result
  orderNumber: string | null;
  orderConfirmed: boolean;
  
  // Actions
  setShow: (showId: string, venue: string, date: string, city: string) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  addTicket: (ticket: TicketSelection) => void;
  updateTicketQuantity: (ticketTypeId: string, quantity: number) => void;
  removeTicket: (ticketTypeId: string) => void;
  
  setSection: (section: SectionSelection | null) => void;
  
  addBundle: (bundle: BundleSelection) => void;
  updateBundleSize: (bundleId: string, size: string) => void;
  removeBundle: (bundleId: string) => void;
  
  setCustomerInfo: (email: string, name: string) => void;
  
  calculateTotals: () => void;
  
  setOrderConfirmed: (orderNumber: string) => void;
  
  resetCart: () => void;
}

const PORTAL_CONVENIENCE_FEE = 2.50;
const TICKETMASTER_FEE_RATE = 0.15; // 15% service fee

export const useTicketCartStore = create<TicketCartState>((set, get) => ({
  currentStep: 1,
  showId: null,
  showVenue: null,
  showDate: null,
  showCity: null,
  tickets: [],
  section: null,
  bundles: [],
  ticketSubtotal: 0,
  bundleSubtotal: 0,
  ticketmasterFees: 0,
  portalConvenienceFee: PORTAL_CONVENIENCE_FEE,
  total: 0,
  customerEmail: '',
  customerName: '',
  orderNumber: null,
  orderConfirmed: false,

  setShow: (showId, venue, date, city) => {
    set({
      showId,
      showVenue: venue,
      showDate: date,
      showCity: city,
      currentStep: 1,
      tickets: [],
      section: null,
      bundles: [],
      orderNumber: null,
      orderConfirmed: false,
    });
  },

  setStep: (step) => set({ currentStep: step }),
  
  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < 5) {
      set({ currentStep: currentStep + 1 });
    }
  },
  
  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: currentStep - 1 });
    }
  },

  addTicket: (ticket) => {
    const { tickets, calculateTotals } = get();
    const existing = tickets.find(t => t.ticketTypeId === ticket.ticketTypeId);
    
    if (existing) {
      set({
        tickets: tickets.map(t =>
          t.ticketTypeId === ticket.ticketTypeId
            ? { ...t, quantity: t.quantity + ticket.quantity }
            : t
        ),
      });
    } else {
      set({ tickets: [...tickets, ticket] });
    }
    calculateTotals();
  },

  updateTicketQuantity: (ticketTypeId, quantity) => {
    const { tickets, calculateTotals } = get();
    if (quantity <= 0) {
      get().removeTicket(ticketTypeId);
      return;
    }
    set({
      tickets: tickets.map(t =>
        t.ticketTypeId === ticketTypeId ? { ...t, quantity } : t
      ),
    });
    calculateTotals();
  },

  removeTicket: (ticketTypeId) => {
    const { tickets, calculateTotals } = get();
    set({ tickets: tickets.filter(t => t.ticketTypeId !== ticketTypeId) });
    calculateTotals();
  },

  setSection: (section) => {
    set({ section });
    get().calculateTotals();
  },

  addBundle: (bundle) => {
    const { bundles, calculateTotals } = get();
    set({ bundles: [...bundles, bundle] });
    calculateTotals();
  },

  updateBundleSize: (bundleId, size) => {
    const { bundles } = get();
    set({
      bundles: bundles.map(b =>
        b.bundleId === bundleId ? { ...b, selectedSize: size } : b
      ),
    });
  },

  removeBundle: (bundleId) => {
    const { bundles, calculateTotals } = get();
    set({ bundles: bundles.filter(b => b.bundleId !== bundleId) });
    calculateTotals();
  },

  setCustomerInfo: (email, name) => {
    set({ customerEmail: email, customerName: name });
  },

  calculateTotals: () => {
    const { tickets, bundles, section } = get();
    
    const priceModifier = section?.priceModifier || 1;
    
    const ticketSubtotal = tickets.reduce(
      (sum, t) => sum + (t.price * t.quantity * priceModifier),
      0
    );
    
    const bundleSubtotal = bundles.reduce(
      (sum, b) => sum + b.price,
      0
    );
    
    const totalTickets = tickets.reduce((sum, t) => sum + t.quantity, 0);
    const ticketmasterFees = ticketSubtotal * TICKETMASTER_FEE_RATE;
    const portalFees = totalTickets * PORTAL_CONVENIENCE_FEE;
    
    const total = ticketSubtotal + bundleSubtotal + ticketmasterFees + portalFees;
    
    set({
      ticketSubtotal,
      bundleSubtotal,
      ticketmasterFees,
      portalConvenienceFee: portalFees,
      total,
    });
  },

  setOrderConfirmed: (orderNumber) => {
    set({ orderNumber, orderConfirmed: true, currentStep: 5 });
  },

  resetCart: () => {
    set({
      currentStep: 1,
      showId: null,
      showVenue: null,
      showDate: null,
      showCity: null,
      tickets: [],
      section: null,
      bundles: [],
      ticketSubtotal: 0,
      bundleSubtotal: 0,
      ticketmasterFees: 0,
      portalConvenienceFee: PORTAL_CONVENIENCE_FEE,
      total: 0,
      customerEmail: '',
      customerName: '',
      orderNumber: null,
      orderConfirmed: false,
    });
  },
}));
