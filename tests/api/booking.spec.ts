import { test, expect, authHeader } from '../../fixtures/api';
import { apiCredentials, apiMessages, buildBooking, type Booking } from '../../data/booking';

test.describe('Booking API', () => {
  test(
    'booking can be created, updated, partially updated and deleted, after which it is no longer found',
    {
      tag: ['@smoke', '@api'],
      annotation: { type: 'bug', description: 'BUG-API-02: DELETE returns 201 Created' },
    },
    async ({ request, authToken }) => {
      const booking = buildBooking();

      const bookingId = await test.step('create booking', async () => {
        const response = await request.post('/booking', { data: booking });
        // Accepted quirk: 200 instead of REST's 201, but this matches the API docs.
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toEqual({ bookingid: expect.any(Number), booking });
        expect(body.bookingid).toBeGreaterThan(0);
        return body.bookingid as number;
      });

      await test.step('get created booking', async () => {
        const response = await request.get(`/booking/${bookingId}`);
        expect(response.status()).toBe(200);
        expect(await response.json()).toEqual(booking);
      });

      const updated: Booking = {
        firstname: `Updated${Date.now()}`,
        lastname: 'Changed',
        totalprice: 456,
        depositpaid: false,
        bookingdates: { checkin: '2027-02-01', checkout: '2027-02-03' },
        additionalneeds: 'Lunch',
      };

      await test.step('update booking with PUT', async () => {
        const response = await request.put(`/booking/${bookingId}`, {
          data: updated,
          headers: authHeader(authToken),
        });
        expect(response.status()).toBe(200);
        expect(await response.json()).toEqual(updated);

        const stored = await request.get(`/booking/${bookingId}`);
        expect(stored.status()).toBe(200);
        expect(await stored.json()).toEqual(updated);
      });

      const patched: Booking = { ...updated, firstname: `Patched${Date.now()}` };

      await test.step('partially update booking with PATCH', async () => {
        const response = await request.patch(`/booking/${bookingId}`, {
          data: { firstname: patched.firstname },
          headers: authHeader(authToken),
        });
        expect(response.status()).toBe(200);
        expect(await response.json()).toEqual(patched);

        const stored = await request.get(`/booking/${bookingId}`);
        expect(stored.status()).toBe(200);
        expect(await stored.json()).toEqual(patched);
      });

      await test.step('delete booking', async () => {
        const response = await request.delete(`/booking/${bookingId}`, {
          headers: authHeader(authToken),
        });
        // BUG-API-02: the API answers 201 Created. Only a 2xx is asserted here;
        // the GET below proves the deletion.
        await expect(response).toBeOK();
      });

      await test.step('deleted booking is no longer found', async () => {
        const response = await request.get(`/booking/${bookingId}`);
        expect(response.status()).toBe(404);
        expect(await response.text()).toBe(apiMessages.notFound);
      });
    },
  );

  test(
    'auth does not issue a token for invalid credentials',
    {
      tag: ['@negative', '@api'],
      annotation: { type: 'bug', description: 'BUG-API-01: returns 200 instead of 401' },
    },
    async ({ request }) => {
      const response = await request.post('/auth', {
        data: { username: apiCredentials.username, password: 'wrong_password' },
      });

      // BUG-API-01: status is deliberately not asserted (the API returns 200 instead of 401).
      // The body must carry the error reason and no token.
      expect(await response.json()).toEqual({ reason: apiMessages.badCredentials });
    },
  );

  test(
    'booking cannot be updated without an auth token',
    { tag: ['@negative', '@api'] },
    async ({ request, authToken }) => {
      const booking = buildBooking();
      const created = await request.post('/booking', { data: booking });
      expect(created.status()).toBe(200);
      const { bookingid } = await created.json();

      try {
        const response = await request.put(`/booking/${bookingid}`, {
          data: buildBooking({ lastname: 'Unauthorised' }),
        });
        // Accepted quirk: 403 Forbidden instead of REST's 401 for a missing token.
        expect(response.status()).toBe(403);
        expect(await response.text()).toBe(apiMessages.forbidden);

        const stored = await request.get(`/booking/${bookingid}`);
        expect(stored.status()).toBe(200);
        expect(await stored.json()).toEqual(booking);
      } finally {
        // Cleanup on the shared instance; not part of what this test verifies.
        await request.delete(`/booking/${bookingid}`, { headers: authHeader(authToken) });
      }
    },
  );

  // BUG-API-03: the API returns 500 Internal Server Error instead of 400.
  // Marked test.fail() so the suite stays green while the bug is open; once the API is
  // fixed this test will pass and Playwright will report it, so remove test.fail() then.
  test.fail(
    'booking without required fields is rejected with 400',
    {
      tag: ['@negative', '@api'],
      annotation: { type: 'bug', description: 'BUG-API-03: returns 500 instead of 400' },
    },
    async ({ request }) => {
      const response = await request.post('/booking', {
        data: { firstname: `Incomplete${Date.now()}` },
      });

      expect(response.status()).toBe(400);
      expect(await response.text()).not.toContain('bookingid');
    },
  );
});
