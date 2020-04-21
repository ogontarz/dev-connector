const jwt = require('jsonwebtoken');
const config = require('config');

const auth = async (req, res, next) => {
	const token = req.header('x-auth-token');
	if (!token) {
		return res.status(401).json({ msg: 'Invalid token' });
	}
	try {
		await jwt.verify(token, config.get('jwtSecret'), (error, decoded) => {
			if (error) {
				return res.status(401).json({ msg: 'Invalid token' });
			}
			req.user = decoded.user;
			next();
		});
	} catch (e) {
		return res.status(401).json({ msg: 'Need authorization' });
	}
};

module.exports = auth;
