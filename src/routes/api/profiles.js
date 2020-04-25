const express = require('express');
const request = require('request');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/user');
const Profile = require('../../models/profile');
const auth = require('../../middleware/auth');

const router = express.Router();

// @route   GET api/profiles/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);
		if (!profile) {
			return res.status(400).json({ msg: 'There is no profile for this user' });
		}
		res.status(200).json(profile);
	} catch (error) {
		console.log(error);
		res.status(500).send('Server error');
	}
});

// @route   POST api/profiles
// @desc    Create or update user profile
// @access  Private
router.post(
	'/',
	[
		auth,
		[check('status', 'Status is required').not().isEmpty(), check('skills', 'Skills is required').not().isEmpty()]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ msg: errors.array() });
		}
		try {
			const { website, location, bio, status, github } = req.body;
			const profileFields = {
				user: req.user.id,
				website,
				location,
				bio,
				status,
				github
			};
			profileFields.skills = req.body.skills.split(',').map((skill) => skill.trim());
			profileFields.social = {};
			profileFields.social.twitter = req.body.twitter;
			profileFields.social.linkedin = req.body.linkedin;

			let profile = await Profile.findOne({ user: req.user.id });
			if (profile) {
				profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFIelds }, { new: true });
				return res.status(200).json(profile);
			}
			profile = new Profile(profileFields);
			await profile.save();
			res.status(200).json(profile);
		} catch (e) {
			res.status(500).json({ msg: 'Server error' });
		}
	}
);

// @route   GET api/profiles
// @desc    Get all profiles
// @access  Public
router.get('/', async (req, res) => {
	try {
		const profiles = await Profile.find().populate('user', ['name', 'avatar']);
		res.status(200).json(profiles);
	} catch (error) {
		console.error(error.message);
		res.status(500).json({ msg: 'Server error' });
	}
});

// @route   GET api/profiles/user/:iser_id
// @desc    Get profile by user id
// @access  Public
router.get('/user/:user_id', async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);
		if (!profile) {
			return res.status(404).json({ msg: 'Profile not found' });
		}
		res.status(200).json(profile);
	} catch (error) {
		console.error(error.message);
		if (error.name == 'CastError') {
			return res.status(404).json({ msg: 'Profile not found' });
		}
		res.status(500).json({ msg: 'Server error' });
	}
});

// @route   DELETE api/profiles
// @desc    Delete profile & user
// @access  Private
router.get('/', auth, async (req, res) => {
	try {
		await Profile.findOneAndRemove({ user: req.user.id });
		await User.findOneAndRemove({ _id: req.user.id });
		res.status(200).json({ msg: 'User deleted' });
	} catch (error) {
		console.error(error.message);
		res.status(500).json({ msg: 'Server error' });
	}
});

// @route   PUT api/profiles/experience
// @desc    Add profile experience
// @access  Private
router.put(
	'/experience',
	[
		auth,
		[
			check('title', 'Title is required').not().isEmpty(),
			check('company', 'Company is required').not().isEmpty(),
			check('from', 'From date is required').not().isEmpty()
		]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty) {
			return res.status(400).json({ msg: errors.array() });
		}
		const exp = {
			...req.body
		};
		try {
			const profile = await Profile.findOne({ user: req.user.id });
			profile.experience.unshift(exp);
			await profile.save();
			res.status(200).json(profile);
		} catch (error) {
			console.error(error.message);
			res.status(500).json({ msg: 'Server error' });
		}
	}
);

// @route   DELETE api/profiles/experience/:exp_id
// @desc    Delete profile experience
// @access  Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id });
		const removeIndex = profile.experience.map((item) => item.id).indexOf(req.params.exp_id);
		profile.experience.splice(removeIndex, 1);
		await profile.save();
		res.status(200).json(profile);
	} catch (error) {
		console.error(error.message);
		res.status(500).json({ msg: 'Server error' });
	}
});

// @route   PUT api/profiles/education
// @desc    Add profile education
// @access  Private
router.put(
	'/education',
	[
		auth,
		[
			check('school', 'School is required').not().isEmpty(),
			check('degree', 'Degree is required').not().isEmpty(),
			check('from', 'From date is required').not().isEmpty()
		]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty) {
			return res.status(400).json({ msg: errors.array() });
		}
		const edu = {
			...req.body
		};
		try {
			const profile = await Profile.findOne({ user: req.user.id });
			profile.education.unshift(edu);
			await profile.save();
			res.status(200).json(profile);
		} catch (error) {
			console.error(error.message);
			res.status(500).json({ msg: 'Server error' });
		}
	}
);

// @route   DELETE api/profiles/education/:edu_id
// @desc    Delete profile education
// @access  Private
router.delete('/experience/:edu_id', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id });
		const removeIndex = profile.education.map((item) => item.id).indexOf(req.params.edu_id);
		profile.education.splice(removeIndex, 1);
		await profile.save();
		res.status(200).json(profile);
	} catch (error) {
		console.error(error.message);
		res.status(500).json({ msg: 'Server error' });
	}
});

// @route   GET api/profiles/github/:usernaame
// @desc    Delete Get user repos from Github
// @access  Public
router.get('/github/:username', async (req, res) => {
	try {
		const options = {
			uri: `https://api.github.com/users/${
				req.params.username
			}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get(
				'githubSecret'
			)}`,
			method: 'GET',
			headers: { 'user-agent': 'node.js' }
		};

		request(options, (error, response, body) => {
			if (error || response.statusCode !== 200) {
				return res.status(404).json({ msg: 'No Github profile found' });
			}
			res.status(200).json(JSON.parse(body));
		});
	} catch (error) {
		res.status(500).json({ msg: 'Server error' });
	}
});

module.exports = router;
