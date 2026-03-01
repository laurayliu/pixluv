import { Router } from 'express';
import * as Posts from './controllers/post_controller.js';
import * as Users from './controllers/user_controller.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'welcome to the pixluv api!' });
});

router.route('/users')
  .get(Users.getUsers)
  .post(Users.createUser);

router.route('/users/:id')
  .get(Users.getUser)
  .put(Users.updateUser)
  .delete(Users.deleteUser);

router.route('/posts')
  .get(Posts.getPosts)
  .post(Posts.createPost);

router.route('/posts/:id')
  .get(Posts.getPost)
  .put(Posts.updatePost)
  .delete(Posts.deletePost);

router.route('/sign-s3')
  .get(Posts.getSignedS3Url);

export default router;
