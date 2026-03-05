import prisma from '../db.js';
import { getS3PresignedUrl } from '../s3.js';

export const getPosts = async (req, res) => {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, tags: true, imageUrl: true, createdAt: true, author: { select: { username: true } } },
  });
  res.json(posts);
};

export const createPost = async (req, res) => {
  const { title, tags, content, imageUrl } = req.body;
  const post = await prisma.post.create({
    data: { title, tags, content, imageUrl, authorId: req.user.id },
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

export const getPostsByUser = async (req, res) => {
  const posts = await prisma.post.findMany({
    where: { authorId: req.paras.userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, tags: true, imageUrl: true, createdAt: true, author: { select: { username: true } } },
  });
  res.json(posts);
};

export const updatePost = async (req, res) => {
  const { title, tags, content, imageUrl } = req.body;
  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: { title, tags, content, imageUrl },
  });
  res.json(post);
};

export const deletePost = async (req, res) => {
  await prisma.post.delete({ where: { id: req.params.id } });
  res.json({ message: 'Post deleted' });
};

export const getSignedS3Url = async (req, res) => {
  const { fileName, fileType } = req.query;
  try {
    const uniqueFileName = `${Date.now()}-${fileName}`;
    const { signedUrl, publicUrl } = await getS3PresignedUrl(uniqueFileName, fileType);
    res.json({ signedUrl, publicUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};