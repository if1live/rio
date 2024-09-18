export const adjustKst = (date: Date) => {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const kstOffset = 9 * 60 * 60 * 1000; // KST는 UTC+9이므로 9시간의 밀리초를 더함
  const kstDate = new Date(utc + kstOffset);
  return kstDate;
};

const getYMD = (date: Date) => {
  return date.toISOString().slice(0, 10);
};

export const deriveDateKst = (date: Date) => {
  const kstDate = adjustKst(date);
  return getYMD(kstDate);
};
