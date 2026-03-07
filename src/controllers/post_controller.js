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
  const { title, tags, content, imageUrl, challengeDate } = req.body;
  const post = await prisma.post.create({
    data: { title, tags, content, imageUrl, authorId: req.user.id, challengeDate: challengeDate ? new Date(challengeDate) : null },
  });
  res.json(post);
};

export const getTodayChallengePosts = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const posts = await prisma.post.findMany({
    where: { challengeDate: { gte: today, lt: tomorrow } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, imageUrl: true, authorId: true, author: { select: { username: true } } },
  });

  const hasSubmitted = posts.some(p => p.authorId === req.user.id);
  res.json({ posts, hasSubmitted });
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
    where: { authorId: req.params.userId },
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

export const toggleLike = async (req, res) => {
  const { id: postId } = req.params;
  const userId = req.user.id;

  const liked = await prisma.like.findUnique({
    where: {userId_postId: { userId, postId }},
  });

  if (liked) {
    await prisma.like.delete({where: { id : liked.id }});
    res.json({ liked: false });
  }

  await prisma.like.create({ data: { userId, postId } });
  return res.json({ liked: true });
}

export const toggleSave = async (req, res) => {
  const { id: postId } = req.params;
  const userId = req.user.id;

  const saved = await prisma.save.findUnique({
    where: {userId_postId: { userId, postId }},
  });

  if (saved) {
    await prisma.save.delete({where: { id : saved.id }});
    res.json({ saved: false });
  }

  await prisma.save.create({ data: { userId, postId } });
  return res.json({ saved: true });
}

export const createComment = async (req, res) => {
  const { id: postId } = req.params;
  const { body } = req.body;
  const userId = req.user.id;

  const comment = await prisma.comment.create({
    data: { body, userId, postId },
    select: {
      id: true,
      body: true,
      createdAt: true,
      user: { select: { username: true, id: true } },
    }
  });
  res.json(comment);
};

export const getComments = async (req, res) => {
  const { id: postId } = req.params;
  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      body: true,
      createdAt: true,
      user: { select: {username: true, id: true } },
    },
  });
  res.json(comments);
}