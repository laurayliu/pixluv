import { Router } from 'express';
import * as Posts from './controllers/post_controller.js';
import * as Users from './controllers/user_controller.js';
import * as Auth from './controllers/auth_controller.js';
import * as Challenges from './controllers/challenge_controller.js';
import requireAuth from './middleware/auth.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'welcome to the pixluv api!' });
});

router.post('/auth/signup', Auth.signup);
router.post('/auth/login', Auth.login);

router.route('/users')
  .get(Users.getUsers);

router.route('/users/:id')
  .get(Users.getUser)
  .put(requireAuth, Users.updateUser)
  .delete(requireAuth, Users.deleteUser);

router.route('/posts')
  .get(Posts.getPosts)
  .post(requireAuth, Posts.createPost);

router.route('/posts/:id')
  .get(Posts.getPost)
  .put(requireAuth, Posts.updatePost)
  .delete(requireAuth, Posts.deletePost);

router.route('/sign-s3')
  .get(requireAuth, Posts.getSignedS3Url);

router.get('/challenges/today', Challenges.getTodayChallenge);
router.route('/challenges')
  .get(Challenges.getChallenges)
  .post(requireAuth, Challenges.createChallenge);
router.route('/challenges/:id')
  .get(Challenges.getChallenge)
  .put(requireAuth, Challenges.updateChallenge)
  .delete(requireAuth, Challenges.deleteChallenge);

export default router;
