import prisma from '../db.js';

export const getTodayChallenge = async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));

    const challenge = await prisma.dailyChallenge.findFirst({
      where: { date: { gte: start, lt: end } },
    });

    if (!challenge) return res.status(404).json({ error: 'No challenge for today' });
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getChallenges = async (req, res) => {
  try {
    const challenges = await prisma.dailyChallenge.findMany({
      orderBy: { date: 'desc' },
    });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getChallenge = async (req, res) => {
  try {
    const challenge = await prisma.dailyChallenge.findUnique({
      where: { id: req.params.id },
    });
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createChallenge = async (req, res) => {
  try {
    const { prompt, date, allowedColors, allowedTools } = req.body;
    const challenge = await prisma.dailyChallenge.create({
      data: { prompt, date: new Date(date), allowedColors, allowedTools },
    });
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateChallenge = async (req, res) => {
  try {
    const { prompt, date, allowedColors, allowedTools } = req.body;
    const challenge = await prisma.dailyChallenge.update({
      where: { id: req.params.id },
      data: { prompt, date: date ? new Date(date) : undefined, allowedColors, allowedTools },
    });
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteChallenge = async (req, res) => {
  try {
    await prisma.dailyChallenge.delete({ where: { id: req.params.id } });
    res.json({ message: 'Challenge deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
