const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	website: {
		type: String
	},
	location: {
		type: String
	},
	status: {
		type: String
	},
	skills: {
		type: [String]
	},
	bio: {
		type: String
	},
	github: {
		type: String
	},
	expierience: [
		{
			title: {
				type: String,
				required: true
			},
			company: {
				type: String,
				required: true
			},
			from: {
				type: Date
			},
			to: {
				type: Date
			},
			current: {
				type: Boolean
			}
		}
	],
	education: [
		{
			school: {
				type: String,
				required: true
			},
			degree: {
				type: String,
				required: true
			},
			from: {
				type: Date
			},
			to: {
				type: Date
			},
			current: {
				type: Boolean
			}
		}
	],
	social: {
		twitter: {
			type: String
		},
		linkedin: {
			type: String
		}
	},
	date: {
		type: Date,
		default: Date.now()
	}
});

const Profile = mongoose.model('Profile', ProfileSchema);

module.exports = Profile;
