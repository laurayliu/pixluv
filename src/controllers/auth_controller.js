import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';

const SALT_ROUNDS = 10;

const STICKERS = {
  FIRST_ACCOUNT: 'FIRST_ACCOUNT',
  FIRST_POST: 'FIRST_POST',
  DAILY_CHALLENGE: 'DAILY_CHALLENGE',
  SEND_PIX: 'SEND_PIX',
  FIRST_COMMENT: 'FIRST_COMMENT',
};

async function backfillStickers(user) {
  const earned = new Set(user.stickers);
  const toAdd = [];

  if (!earned.has(STICKERS.FIRST_ACCOUNT)) toAdd.push(STICKERS.FIRST_ACCOUNT);

  if (!earned.has(STICKERS.FIRST_POST)) {
    const post = await prisma.post.findFirst({ where: { authorId: user.id, challengeDate: null }, select: { id: true } });
    if (post) toAdd.push(STICKERS.FIRST_POST);
  }

  if (!earned.has(STICKERS.DAILY_CHALLENGE)) {
    const post = await prisma.post.findFirst({ where: { authorId: user.id, challengeDate: { not: null } }, select: { id: true } });
    if (post) toAdd.push(STICKERS.DAILY_CHALLENGE);
  }

  if (!earned.has(STICKERS.SEND_PIX)) {
    const pix = await prisma.chat.findFirst({ where: { senderId: user.id }, select: { id: true } });
    if (pix) toAdd.push(STICKERS.SEND_PIX);
  }

  if (!earned.has(STICKERS.FIRST_COMMENT)) {
    const comment = await prisma.comment.findFirst({ where: { userId: user.id }, select: { id: true } });
    if (comment) toAdd.push(STICKERS.FIRST_COMMENT);
  }

  if (toAdd.length === 0) return user;

  return prisma.user.update({
    where: { id: user.id },
    data: { stickers: { push: toAdd } },
  });
}

export const signup = async (req, res) => {
  const { username, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { username, email, password: hashedPassword, colorPalette: [], stickers: [STICKERS.FIRST_ACCOUNT] },
  });

  const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

  const { password: _, ...userWithoutPassword } = user;
  res.json({ token, user: userWithoutPassword });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'invalid email or password' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'invalid email or password' });

  const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

  const updatedUser = await backfillStickers(user);
  const { password: _, ...userWithoutPassword } = updatedUser;
  res.json({ token, user: userWithoutPassword });
};
