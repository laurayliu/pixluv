export async function unlockSticker(
  stickerId: string,
  currentStickers: string[],
  updateUser: (data: { stickers: string[] }) => Promise<void>
): Promise<boolean> {
  if (currentStickers.includes(stickerId)) return false;
  await updateUser({ stickers: [...currentStickers, stickerId] });
  return true;
}
