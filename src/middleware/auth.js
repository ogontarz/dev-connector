const jwt = require('jsonwebtoken');
const config = require('config');

const auth = async (req, res, next) => {
	try {
		const token = req.header('x-auth-token');
		if (!token) {
			throw new Error();
		}
		jwt.verify(token, config.get('jwtSecret'), (error, decoded) => {
			if (error) {
				throw new Error();
			}
			req.user = decoded.user;
			next();
		});
	} catch (e) {
		return res.status(401).json({ msg: 'Need authorization' });
	}
};

module.exports = auth;
