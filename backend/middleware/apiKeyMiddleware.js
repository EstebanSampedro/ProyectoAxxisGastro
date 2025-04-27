// Middleware para verificar la API Key en las solicitudes
const apiKeyMiddleware = (req, res, next) => {
    if (!process.env.API_KEY) {
        console.error('API_KEY no está configurada en las variables de entorno');
        return res.status(500).json({ error: 'Error de configuración del servidor' });
    }

    const clientKey = req.headers['x-api-key'];

    if (!clientKey || clientKey !== process.env.API_KEY) {
        return res.status(403).json({ error: 'API Key inválida o faltante' });
    }

    next();
};

module.exports = apiKeyMiddleware;
