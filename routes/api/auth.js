const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

const User = require('../../models/user');
const auth = require('../../middleware/auth');

const router = express.Router();

// @route    GET api/auth
// @desc     Get user by token
// @access   Private
router.get('/', auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select('-password');
		res.json(user);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route   POST api/
// @desc    Login user
// @access  Public
router.post(
	'/',
	[check('email', 'Please use valid email').isEmail(), check('password', 'Password is required').exists()],
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
			const payload = {
				user: {
					id: user.id
				}
			};
			jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 360000 }, (error, token) => {
				if (error) {
					throw error;
				}
				return res.status(201).json({ token });
			});
		} catch (e) {
			console.error(e.message);
			res.status(500).send(e);
		}
	}
);

module.exports = router;
