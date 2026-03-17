export const STICKER_DEFS = [
  { id: 'FIRST_ACCOUNT',   label: 'Welcome to the Pixfam!',       iconName: 'sticker1' },
  { id: 'FIRST_POST',      label: 'First Post!',                   iconName: 'sticker2' },
  { id: 'SEND_PIX',        label: 'Send Pix!',                     iconName: 'sticker3' },
  { id: 'DAILY_CHALLENGE', label: 'Leap of Faith',                 iconName: 'sticker4' },
  { id: 'FIRST_COMMENT',   label: 'Made Your First Comment!',      iconName: 'sticker5' },
];

export type StickerId = 'FIRST_ACCOUNT' | 'FIRST_POST' | 'SEND_PIX' | 'DAILY_CHALLENGE' | 'FIRST_COMMENT';

export const getStickerDef = (id: string) => STICKER_DEFS.find(s => s.id === id);
