// Public Restful Booker admin credentials; override via environment variables if needed.
export const apiCredentials = {
  username: process.env.RB_USERNAME ?? 'admin',
  password: process.env.RB_PASSWORD ?? 'password123',
};

export interface Booking {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: { checkin: string; checkout: string };
  additionalneeds: string;
}

// The API instance is public and shared, so every booking gets a unique first name.
export function buildBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    firstname: `Test${Date.now()}`,
    lastname: 'Booker',
    totalprice: 123,
    depositpaid: true,
    bookingdates: { checkin: '2027-01-10', checkout: '2027-01-15' },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}

// Exact plain-text / JSON responses observed on restful-booker.herokuapp.com.
export const apiMessages = {
  badCredentials: 'Bad credentials',
  forbidden: 'Forbidden',
  notFound: 'Not Found',
} as const;
