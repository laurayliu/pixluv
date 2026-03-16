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
    include: {
      posts: { orderBy: { createdAt: 'desc' }, select: { id: true, content: true, imageUrl: true, createdAt: true } },
      _count: { select: { followers: true, following: true } },
    },
  });
  if (!user) return res.status(404).json({ error: 'user not found' });
  res.json(user);
};

export const followUser = async (req, res) => {
  const followerId = req.user.id;
  const followingId = req.params.id;
  if (followerId === followingId) return res.status(400).json({ error: 'cannot follow yourself' });
  const follow = await prisma.follow.upsert({
    where: { followerId_followingId: { followerId, followingId } },
    create: { followerId, followingId },
    update: {},
  });
  res.json(follow);
};

export const unfollowUser = async (req, res) => {
  const followerId = req.user.id;
  const followingId = req.params.id;
  await prisma.follow.deleteMany({ where: { followerId, followingId } });
  res.json({ message: 'unfollowed' });
};

export const getFollowers = async (req, res) => {
  const followers = await prisma.follow.findMany({
    where: { followingId: req.params.id },
    include: { follower: { select: { id: true, username: true, profilePicture: true } } },
  });
  res.json(followers.map((f) => f.follower));
};

export const getFollowing = async (req, res) => {
  const following = await prisma.follow.findMany({
    where: { followerId: req.params.id },
    include: { following: { select: { id: true, username: true, profilePicture: true } } },
  });
  res.json(following.map((f) => f.following));
};

export const updateUser = async (req, res) => {
  const { username, email, profilePicture, bio, stickers } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { username, email, profilePicture, bio, stickers },
  });
  res.json(user);
};

export const deleteUser = async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ message: 'user deleted' });
};
