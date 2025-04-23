const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Puedes acceder al usuario decodificado en otras rutas
        next();
    } catch (err) {
        console.error('Token inválido:', err.message);
        return res.status(403).json({ error: 'Token inválido o expirado' });
    }
};

module.exports = authMiddleware;
