const GetDurationFormat = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const readable = secs > 9 ? secs : `0${secs}`;
  return `${mins}:${readable}`;
};

export default { GetDurationFormat };
