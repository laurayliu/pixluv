import prisma from '../db.js';

export const getConversations = async (req, res) => {
  const userId = req.user.id;
  const messages = await prisma.chat.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, username: true } },
      receiver: { select: { id: true, username: true } },
    },
  });

  const seen = new Set();
  const conversations = [];
  for (const msg of messages) {
    const other = msg.senderId === userId ? msg.receiver : msg.sender;
    if (!seen.has(other.id)) {
      seen.add(other.id);
      conversations.push({ user: other, latestMessage: msg });
    }
  }

  res.json(conversations);
};

export const getMessages = async (req, res) => {
  const userId = req.user.id;
  const { otherUserId } = req.params;
  const messages = await prisma.chat.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: { select: { username: true } },
    },
  });
  res.json(messages);
};

export const sendMessage = async (req, res) => {
  const senderId = req.user.id;
  const { receiverId, message, imageUrl } = req.body;

  if (!message && !imageUrl) {
    return res.status(400).json({ error: 'message or imageUrl required' });
  }

  const chat = await prisma.chat.create({
    data: { senderId, receiverId, message, imageUrl },
    include: { sender: { select: { username: true } } },
  });
  res.json(chat);
};
