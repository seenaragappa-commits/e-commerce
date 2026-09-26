// Unit tests for small helpers (no database needed).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { lastCalendarDays, toDateKey } from '../utils/helpers.js';
import { getAllowedStatusUpdates, getNextStatus } from '../services/orderService.js';

describe('toDateKey', () => {
  it('returns the calendar date in the given time zone', () => {
    const moment = new Date('2026-09-24T20:00:00Z');
    assert.equal(toDateKey(moment, 'UTC'), '2026-09-24');
    assert.equal(toDateKey(moment, 'Asia/Kolkata'), '2026-09-25', '01:30 the next day in India');
    assert.equal(toDateKey(moment, 'America/New_York'), '2026-09-24');
  });
});

describe('lastCalendarDays (sales chart days)', () => {
  const expectConsecutive = (days, first, last) => {
    assert.equal(days.length, 7);
    assert.equal(days[0], first);
    assert.equal(days.at(-1), last);
    assert.equal(new Set(days).size, 7, 'no repeated days');
    for (let index = 1; index < days.length; index += 1) {
      const gap = (Date.parse(days[index]) - Date.parse(days[index - 1])) / 86400000;
      assert.equal(gap, 1, `${days[index - 1]} -> ${days[index]} should be one day`);
    }
  };

  it('lists the last 7 days, oldest first', () => {
    expectConsecutive(lastCalendarDays(new Date('2026-09-25T06:00:00Z'), 'Asia/Kolkata', 7), '2026-09-19', '2026-09-25');
  });

  it('does not skip a day after clocks go forward (23-hour day)', () => {
    // 2026-03-09 00:30 in New York, the night after daylight saving time started.
    expectConsecutive(lastCalendarDays(new Date('2026-03-09T04:30:00Z'), 'America/New_York', 7), '2026-03-03', '2026-03-09');
  });

  it('does not repeat a day after clocks go back (25-hour day)', () => {
    // 2026-11-02 23:30 in New York, the day after daylight saving time ended.
    expectConsecutive(lastCalendarDays(new Date('2026-11-03T04:30:00Z'), 'America/New_York', 7), '2026-10-27', '2026-11-02');
  });

  it('crosses month and year boundaries', () => {
    expectConsecutive(lastCalendarDays(new Date('2027-01-02T12:00:00Z'), 'UTC', 7), '2026-12-27', '2027-01-02');
  });
});

describe('order status rules', () => {
  it('allows exactly one step forward, or cancelling before delivery', () => {
    assert.deepEqual(getAllowedStatusUpdates('Order Placed'), ['Confirmed', 'Cancelled']);
    assert.deepEqual(getAllowedStatusUpdates('Processing'), ['Shipped', 'Cancelled']);
    assert.deepEqual(getAllowedStatusUpdates('Out for Delivery'), ['Delivered', 'Cancelled']);
  });

  it('treats Delivered and Cancelled as final', () => {
    assert.deepEqual(getAllowedStatusUpdates('Delivered'), []);
    assert.deepEqual(getAllowedStatusUpdates('Cancelled'), []);
    assert.equal(getNextStatus('Delivered'), null);
    assert.equal(getNextStatus('Cancelled'), null);
  });
});
