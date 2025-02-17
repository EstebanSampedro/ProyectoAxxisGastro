const bcrypt = require('bcrypt');

const password = 'admin'; // la contraseña en texto plano
const saltRounds = 10; // número de rondas para el hash

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error al generar el hash:', err);
    return;
  }
  console.log(`Hash para "admin": ${hash}`);
});
