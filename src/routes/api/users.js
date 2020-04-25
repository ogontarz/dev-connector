const express = require('express');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/user');

const router = express.Router();

// @route   POST api/users
// @desc    Create new user
// @access  Public
router.post(
	'/',
	[
		check('name', 'Name is required').not().isEmpty(),
		check('email', 'Email is not valid').isEmail(),
		check('password', 'User password is less then 6 characters').isLength({ min: 6 })
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		try {
			let existingUser = await User.findOne({ email: req.body.email });
			if (existingUser) {
				return res.status(400).json({ errors: [{ msg: 'User already exist' }] });
			}
			const salt = await bcrypt.genSalt(10);
			const password = await bcrypt.hash(req.body.password, salt);
			const avatar = gravatar.url(req.body.email, { s: '200', r: 'pg', d: 'mm' });

			const user = new User({
				name: req.body.name,
				email: req.body.email,
				password,
				avatar
			});
			await user.save();

			const token = generateToken(user.id);
			return res.status(201).json({ token });
		} catch (e) {
			res.status(500).json({ msg: 'Server error' });
		}
	}
);

// @route   POST api/users/login
// @desc    Login existing user
// @access  Public
router.post(
	'/login',
	[check('email', 'Email is not valid').isEmail(), check('password', 'Password is required').not().isEmpty()],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const { email, password } = req.body;
		try {
			let user = await User.findOne({ email });
			if (!user) {
				return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
			}
			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) {
				return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
			}
			const token = generateToken(user.id);
			return res.status(201).json({ token });
		} catch (e) {
			res.status(500).json({ msg: 'Server error' });
		}
	}
);

const generateToken = (userId) => {
	const payload = {
		user: {
			id: userId
		}
	};
	const token = jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 360000 });
	return token;
};

module.exports = router;
