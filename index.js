const express = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Configuración de la conexión a PostgreSQL (Apunta a tu EC2)
const pool = new Pool({
    user: 'admin_erp',
    host: 'localhost',      
    database: 'cruz_azul_db',
    password: 'Inacap2026',
    port: 5433, // <-- ¡Cambiamos el puerto a 5433!
});

// Clave secreta para firmar los tokens (En producción debería ir en un archivo .env)
const SECRET_KEY = 'cruzazul_clave_super_secreta';

// ---------------------------------------------------------
// RUTA 1: Login (Generación de Token)
// ---------------------------------------------------------
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Usuario "quemado" en código para la prueba de concepto (PoC)
    if (username === 'admin' && password === 'admin123') {
        // Generar token con 1 hora de expiración
        const token = jwt.sign({ user: username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ mensaje: 'Autenticación exitosa', token: token });
    } else {
        res.status(401).json({ error: 'Credenciales inválidas' });
    }
});

// ---------------------------------------------------------
// MIDDLEWARE: Verificación de Token
// ---------------------------------------------------------
const verificarToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ error: 'Acceso denegado. Se requiere un token.' });
    }

    try {
        // El token suele enviarse como "Bearer <token>"
        const tokenLimpio = token.split(' ')[1];
        const verificado = jwt.verify(tokenLimpio, SECRET_KEY);
        req.usuario = verificado;
        next(); // Permite pasar a la ruta protegida
    } catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

// ---------------------------------------------------------
// RUTA 2: Recurso Protegido del ERP (Requiere Token)
// ---------------------------------------------------------
app.get('/api/erp/datos', verificarToken, async (req, res) => {
    try {
        // Prueba de conexión a la base de datos
        const result = await pool.query('SELECT NOW() AS hora_actual');
        res.json({
            mensaje: 'Bienvenido al ERP Cruz Azul',
            usuario_autorizado: req.usuario.user,
            estado_bd: 'Conectado exitosamente',
            hora_servidor_db: result.rows[0].hora_actual
        });
    } catch (error) {
        res.status(500).json({ error: 'Error conectando a la BD', detalle: error.message });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Web ERP corriendo en el puerto ${PORT}`);
});