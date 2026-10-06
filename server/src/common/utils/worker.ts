const idlePollMs = 50;

export const waitWhileBusy = async (
  isBusy: () => boolean,
  timeoutMs = 8_000,
): Promise<void> => {
  const started = Date.now();
  while (isBusy() && Date.now() - started < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, idlePollMs));
  }
};
