const express = require('express');
const { check, validationResult } = require('express-validator');

const User = require('../../models/user');
const Post = require('../../models/post');
const auth = require('../../middleware/auth');

const router = express.Router();

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post('/', [auth, [check('text', 'Text is required').not().isEmpty()]], async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ msg: errors.array() });
	}
	try {
		const user = await User.findById(req.user.id).select('-password');
		const newPost = new Post({
			text: req.body.text,
			name: user.name,
			avatar: user.avatar,
			user: req.user.id
		});
		const post = await newPost.save();
		res.status(200).json(post);
	} catch (error) {
		console.error(error.message);
		res.status(500).json({ msg: 'Server error' });
	}
});

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get('/', auth, async (req, res) => {
	try {
		const posts = await Post.find().sort({ date: -1 });
		res.status(200).json(posts);
	} catch (error) {
		console.error(error.message);
		res.status(500).json({ msg: 'Server error' });
	}
});

// @route   GET api/posts/:post_id
// @desc    Get post by id
// @access  Private
router.get('/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(404).json({ msg: 'Post not found' });
		}
		res.status(200).json(post);
	} catch (error) {
		console.error(error.message);
		if (error.name == 'CastError') {
			return res.status(404).json({ msg: 'Post not found' });
		}
		res.status(500).json({ msg: 'Server error' });
	}
});

// @route   DELETE api/posts/:post_id
// @desc    DELETE post by id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);
		if (!post) {
			return res.status(404).json({ msg: 'Post not found' });
		}
		if (post.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: 'Need authorization' });
		}
		await post.remove();
		res.status(200).json({ msg: 'Post removed' });
	} catch (error) {
		console.error(error.message);
		if (error.name == 'CastError') {
			return res.status(404).json({ msg: 'Post not found' });
		}
		res.status(500).json({ msg: 'Server error' });
	}
});

// @route   PUT api/posts/like/:post_id
// @desc    Like a post by id
// @access  Private
router.put('/like/:post_id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);
		if (!post) {
			return res.status(404).json({ msg: 'Post not found' });
		}
		if (post.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: 'Need authorization' });
		}
		if (post.likes.filter((like) => like.user.toString() === req.user.id).length > 0) {
			return res.json(400).json({ msg: 'Post already liked' });
		}
		post.likes.unshift({ user: req.user.id });
		await post.save();
		res.status(200).json(post.likes);
	} catch (error) {
		console.error(error.message);
		if (error.name == 'CastError') {
			return res.status(404).json({ msg: 'Post not found' });
		}
		res.status(500).json({ msg: 'Server error' });
	}
});

// @route   PUT api/posts/unlike/:post_id
// @desc    Unlike a post by id
// @access  Private
router.put('/unlike/:post_id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);
		if (!post) {
			return res.status(404).json({ msg: 'Post not found' });
		}
		if (post.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: 'Need authorization' });
		}
		if (post.likes.filter((like) => like.user.toString() === req.user.id).length == 0) {
			return res.json(400).json({ msg: 'Post noy yet liked' });
		}
		const removeIndex = post.likes.map((like) => like.user.toString()).indexOf(req.user.id);
		post.likes.splice(removeIndex, 1);
		await post.save();
		res.status(200).json(post.likes);
	} catch (error) {
		console.error(error.message);
		if (error.name == 'CastError') {
			return res.status(404).json({ msg: 'Post not found' });
		}
		res.status(500).json({ msg: 'Server error' });
	}
});

// @route   POST api/posts/comment/:post_id
// @desc    Create a comment
// @access  Private
router.post('/comment/:post_id', [auth, [check('text', 'Text is required').not().isEmpty()]], async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ msg: errors.array() });
	}
	try {
		const user = await User.findById(req.user.id).select('-password');
		const post = await Post.findById(req.params.post_id);
		const newComment = {
			text: req.body.text,
			name: user.name,
			avatar: user.avatar,
			user: req.user.id
		};
		post.comments.unshift(newComment);
		await post.save();
		res.status(200).json(post.comments);
	} catch (error) {
		console.error(error);
		res.status(500).json({ msg: 'Server error' });
	}
});

// @route   DELETE api/posts/comment/:post_id/:comment_id
// @desc    Delete a comment by id
// @access  Private
router.delete('/comment/:post_id/:comment_id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);
		if (!post) {
			return res.status(404).json({ msg: 'Post not found' });
		}
		if (post.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: 'Need authorization' });
		}
		const comment = post.comments.find((comment) => comment.id === req.paramas.comment_id);
		if (!comment) {
			return res.status(404).json({ msg: 'Comment not found' });
		}
		if (comment.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: 'Need authorization' });
		}
		const removeIndex = post.comments.map((comment) => comment.id.toString()).indexOf(comment.id);
		post.likes.splice(removeIndex, 1);
		await post.save();
		res.status(200).json(post.comments);
	} catch (error) {
		console.error(error.message);
		if (error.name == 'CastError') {
			return res.status(404).json({ msg: 'Post not found' });
		}
		res.status(500).json({ msg: 'Server error' });
	}
});

module.exports = router;
