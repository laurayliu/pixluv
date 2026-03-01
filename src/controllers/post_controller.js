import prisma from '../db.js';

export const getPosts = async (req, res) => {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, tags: true, coverUrl: true, createdAt: true, author: { select: { username: true } } },
  });
  res.json(posts);
};

export const createPost = async (req, res) => {
  const { title, tags, content, coverUrl, authorId } = req.body;
  const post = await prisma.post.create({
    data: { title, tags, content, coverUrl, authorId },
  });
  res.json(post);
};

export const getPost = async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: { author: { select: { username: true } } },
  });
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
};

export const updatePost = async (req, res) => {
  const { title, tags, content, coverUrl } = req.body;
  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: { title, tags, content, coverUrl },
  });
  res.json(post);
};

export const deletePost = async (req, res) => {
  await prisma.post.delete({ where: { id: req.params.id } });
  res.json({ message: 'Post deleted' });
};