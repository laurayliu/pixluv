import prisma from '../db.js';

export const getUsers = async (req, res) => {
  const { search } = req.query;
  const users = await prisma.user.findMany({
    where: search ? { username: { contains: search, mode: 'insensitive' } } : undefined,
    orderBy: { createdAt: 'desc' },
    select: { id: true, username: true, profilePicture: true },
  });
  res.json(users);
};

export const createUser = async (req, res) => {
  const { username, email } = req.body;
  const user = await prisma.user.create({
    data: { username, email },
  });
  res.json(user);
};

export const getUser = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { posts: { orderBy: { createdAt: 'desc' }, select: { id: true, content: true, imageUrl: true, createdAt: true } } },
  });
  if (!user) return res.status(404).json({ error: 'user not found' });
  res.json(user);
};

export const updateUser = async (req, res) => {
  const { username, email, profilePicture } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { username, email, profilePicture },
  });
  res.json(user);
};

export const deleteUser = async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ message: 'user deleted' });
};
