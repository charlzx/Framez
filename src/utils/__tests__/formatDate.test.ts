import { formatDate, formatTimestamp } from '../formatDate';

describe('formatDate', () => {
  const now = Date.UTC(2024, 0, 1, 12, 0, 0);
  let dateNowSpy: jest.SpyInstance<number, []>;

  beforeAll(() => {
    dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(now);
  });

  afterAll(() => {
    dateNowSpy.mockRestore();
  });

  it('returns "just now" for timestamps within the last minute', () => {
    expect(formatDate(now - 15 * 1000)).toBe('just now');
  });

  it('returns minutes for timestamps within the hour', () => {
    expect(formatDate(now - 3 * 60 * 1000)).toBe('3m ago');
  });

  it('returns hours for timestamps within the day', () => {
    expect(formatDate(now - 5 * 60 * 60 * 1000)).toBe('5h ago');
  });

  it('returns days for timestamps within the week', () => {
    expect(formatDate(now - 3 * 24 * 60 * 60 * 1000)).toBe('3d ago');
  });

  it('returns weeks for timestamps within the month', () => {
    expect(formatDate(now - 2 * 7 * 24 * 60 * 60 * 1000)).toBe('2w ago');
  });

  it('returns formatted date when older than a month', () => {
    expect(formatDate(Date.UTC(2023, 9, 1))).toBe('Oct 1, 2023');
  });
});

describe('formatTimestamp', () => {
  it('formats timestamp with full date and time', () => {
    const timestamp = Date.UTC(2024, 0, 1, 9, 30, 0);
    expect(formatTimestamp(timestamp)).toBe('Jan 1, 2024, 9:30 AM');
  });
});
