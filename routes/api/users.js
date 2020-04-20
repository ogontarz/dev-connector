const express = require('express');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../../models/user');
const { check, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET api/users
// @desc    Test route
// @access  Public
router.get(
	'/',
	[
		check('name', 'Name is required').not().isEmpty(),
		check('email', 'Please use valid email').isEmail(),
		check('password', 'User password with 6 or more characters').isLength({ min: 6 })
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const { name, email, password } = req.body;
		try {
			let user = await User.findOne({ email });
			if (user) {
				return res.status(400).json({ errors: [{ msg: 'User already exist' }] });
			}
			const avatar = gravatar.url(email, {
				s: '200',
				r: 'pg',
				d: 'mm'
			});
			user = new User({
				name,
				email,
				avatar,
				password
			});
			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(password, salt);
			await user.save();

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
