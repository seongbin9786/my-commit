export const append0 = (num: number) => (num <= 9 ? `0${num}` : num + '');

export const getDateString = (date: Date) => {
  return `${date.getFullYear()}-${append0(date.getMonth() + 1)}-${append0(
    date.getDate(),
  )}`;
};

const DATE_STRING_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const isValidDateString = (dateString: string) => {
  if (!DATE_STRING_REGEX.test(dateString)) {
    return false;
  }

  const [yearString, monthString, dayString] = dateString.split('-');
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);

  const parsedDate = new Date(year, month - 1, day);

  return (
    Number.isFinite(parsedDate.getTime()) &&
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day
  );
};

// TODO: validation하기
export const justOneDayAwayAtMost = (
  dateAString: string,
  dateBString: string,
) => {
  // getTime은 치트키지만...
  const dateA = new Date(dateAString).getTime();
  const dateB = new Date(dateBString).getTime();
  const diffInMillis = Math.abs(dateA - dateB);

  const startOfYesterday = HOURS_OF_24_IN_MS * 2;
  const endOfYesterday = HOURS_OF_24_IN_MS;
  return diffInMillis <= startOfYesterday && diffInMillis >= endOfYesterday;
};

export const getTodayString = () => getDateString(new Date());

export const HOURS_OF_24_IN_MS = 24 * 60 * 60 * 1000;

export const HOURS_OF_24_IN_MINUTES = 24 * 60 * 60;

export const getDateStringDayBefore = (date: string) =>
  getDateString(new Date(new Date(date).getTime() - HOURS_OF_24_IN_MS));

export const getDateStringDayAfter = (date: string) =>
  getDateString(new Date(new Date(date).getTime() + HOURS_OF_24_IN_MS));

/**
 * hh:mm 형식의 시각을(e.g. 06:00) 숫자로 된 분 단위로(e.g. 720) 변환한다.
 *
 * @param timeStr hh:mm
 * @returns minutes
 */
export const timeStringToMinutes = (timeStr: string) => {
  const [hStr, mStr] = timeStr.split(':');
  // validation의 중요성...
  if (!mStr) {
    throw new Error(
      `[timeStringToMinutes] timeStr은 hh:mm 형식이어야 합니다. 입력: [${timeStr}]`,
    );
  }
  return Number(hStr) * 60 + Number(mStr);
};

/**
 * 숫자로 된 분 단위를(e.g. 720) hh:mm 형식의 시각으로(e.g. 06:00) 변환한다.
 *
 * @param minutes minutes
 * @returns hh:mm
 */
export const minutesToTimeString = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${append0(h)}:${append0(m)}`;
};

/**
 * string으로된 날짜의 오늘 시각을 분 단위로(e.g. 720) 변환한다.
 *
 * @param timeStr timsStr
 * @returns minutes
 */
export const minutesOf = (timeStr: string) => {
  const [h, m] = timeStr.split(':');
  return Number.parseInt(h) * 60 + Number.parseInt(m);
};

/**
 * string으로된 두 시각의 간격을 분 단위로 변환한다.
 *
 * TODO: hh:mm 단위의 validation을 넣어서 잘못된 사용을 막아야 할 듯(내가 당했음..!)
 *
 * @param startedAt startedAt
 * @param endedAt endedAt
 * @returns minutes
 */
export const diffBetweenTimeStrings = (startedAt: string, endedAt: string) =>
  timeStringToMinutes(endedAt) - timeStringToMinutes(startedAt);
