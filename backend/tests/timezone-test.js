// ============================================================
// PRUEBAS DE TIMEZONE PARA AMERICA/GUAYAQUIL
// Ejecuta estas pruebas para verificar compatibilidad
// ============================================================

const { DateTime } = require('luxon');

// Función de prueba que simula el backend
function testReagendarCita(fecha, hora, descripcion) {
    console.log(`\n🧪 PRUEBA: ${descripcion}`);
    console.log(`📅 Input - Fecha: ${fecha}, Hora: ${hora}`);

    const zona = 'America/Guayaquil';

    // 1. Crear DateTime en zona Guayaquil (como en tu backend)
    const fechaHoraStr = `${fecha}T${hora.padEnd(8, ':00')}`;
    const dtInicio = DateTime.fromISO(fechaHoraStr, { zone: zona });
    const dtTermina = dtInicio.plus({ minutes: 30 });

    // 2. Crear DateTime objects para Prisma (solución actual)
    const baseDate = '1970-01-01';
    const horaDateTime = new Date(`${baseDate}T${dtInicio.toFormat('HH:mm:ss')}Z`);
    const horaTerminaDateTime = new Date(`${baseDate}T${dtTermina.toFormat('HH:mm:ss')}Z`);

    // 3. Verificar conversión a timezone de Guayaquil
    const horaEnGuayaquil = DateTime.fromJSDate(horaDateTime).setZone('America/Guayaquil');
    const horaTerminaEnGuayaquil = DateTime.fromJSDate(horaTerminaDateTime).setZone('America/Guayaquil');

    console.log(`✅ DateTime creado: ${dtInicio.toISO()}`);
    console.log(`💾 Para MySQL: ${horaDateTime.toISOString()}`);
    console.log(`🕒 Hora en Guayaquil: ${horaEnGuayaquil.toFormat('HH:mm:ss')}`);
    console.log(`🕒 Hora término en Guayaquil: ${horaTerminaEnGuayaquil.toFormat('HH:mm:ss')}`);

    // Verificar que la hora se mantiene igual
    const horaOriginal = hora.padEnd(8, ':00');
    const horaResultante = horaEnGuayaquil.toFormat('HH:mm:ss');
    const esCorrecta = horaOriginal === horaResultante;

    console.log(`${esCorrecta ? '✅' : '❌'} Resultado: ${esCorrecta ? 'CORRECTO' : 'INCORRECTO'}`);
    if (!esCorrecta) {
        console.log(`❌ Esperado: ${horaOriginal}, Obtenido: ${horaResultante}`);
    }

    return esCorrecta;
}

// Función para probar diferentes escenarios
function ejecutarPruebasCompletas() {
    console.log('🚀 INICIANDO PRUEBAS DE TIMEZONE AMERICA/GUAYAQUIL\n');

    const pruebas = [
        { fecha: '2025-05-29', hora: '08:00', desc: 'Hora temprana (8 AM)' },
        { fecha: '2025-05-29', hora: '12:00', desc: 'Mediodía (12 PM)' },
        { fecha: '2025-05-29', hora: '18:30', desc: 'Tarde (6:30 PM)' },
        { fecha: '2025-05-29', hora: '23:45', desc: 'Noche (11:45 PM)' },
        { fecha: '2025-05-29', hora: '00:15', desc: 'Medianoche (12:15 AM)' },
        { fecha: '2025-12-25', hora: '14:30', desc: 'Fecha en diciembre (2:30 PM)' },
        { fecha: '2025-06-15', hora: '09:15', desc: 'Fecha en junio (9:15 AM)' }
    ];

    let pruebasCorrectas = 0;

    pruebas.forEach(prueba => {
        if (testReagendarCita(prueba.fecha, prueba.hora, prueba.desc)) {
            pruebasCorrectas++;
        }
    });

    console.log(`\n📊 RESULTADOS FINALES:`);
    console.log(`✅ Pruebas correctas: ${pruebasCorrectas}/${pruebas.length}`);
    console.log(`${pruebasCorrectas === pruebas.length ? '🎉 TODAS LAS PRUEBAS PASARON' : '⚠️ ALGUNAS PRUEBAS FALLARON'}`);

    return pruebasCorrectas === pruebas.length;
}

// Función para probar timezone del sistema
function verificarTimezoneDelSistema() {
    console.log('\n🌍 VERIFICANDO TIMEZONE DEL SISTEMA');

    const ahora = new Date();
    const ahoraGuayaquil = DateTime.now().setZone('America/Guayaquil');
    const ahoraLocal = DateTime.now();

    console.log(`🖥️  Timezone del sistema: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    console.log(`🕒 Hora local: ${ahoraLocal.toFormat('yyyy-MM-dd HH:mm:ss ZZZZ')}`);
    console.log(`🇪🇨 Hora en Guayaquil: ${ahoraGuayaquil.toFormat('yyyy-MM-dd HH:mm:ss ZZZZ')}`);

    const offsetGuayaquil = ahoraGuayaquil.offset / 60; // en horas
    console.log(`📍 Offset de Guayaquil: UTC${offsetGuayaquil >= 0 ? '+' : ''}${offsetGuayaquil}:00`);

    return {
        timezoneLocal: Intl.DateTimeFormat().resolvedOptions().timeZone,
        offsetGuayaquil: offsetGuayaquil
    };
}

// Función para simular la consulta que harías a tu base de datos
function simularConsultaBaseDatos() {
    console.log('\n🗄️  SIMULANDO CONSULTA A BASE DE DATOS');

    // Simular datos que vendrían de MySQL
    const datosDeBD = {
        fecha: new Date('2025-05-29T00:00:00.000Z'),
        hora: new Date('1970-01-01T08:00:00.000Z'),
        horaTermina: new Date('1970-01-01T08:30:00.000Z')
    };

    console.log('📥 Datos de la BD:', datosDeBD);

    // Convertir a timezone de Guayaquil para mostrar
    const fechaEnGuayaquil = DateTime.fromJSDate(datosDeBD.fecha).setZone('America/Guayaquil');
    const horaEnGuayaquil = DateTime.fromJSDate(datosDeBD.hora).setZone('America/Guayaquil');
    const horaTerminaEnGuayaquil = DateTime.fromJSDate(datosDeBD.horaTermina).setZone('America/Guayaquil');

    console.log('🇪🇨 Interpretado en Guayaquil:');
    console.log(`   📅 Fecha: ${fechaEnGuayaquil.toFormat('yyyy-MM-dd')}`);
    console.log(`   🕒 Hora: ${horaEnGuayaquil.toFormat('HH:mm:ss')}`);
    console.log(`   🕒 Hora término: ${horaTerminaEnGuayaquil.toFormat('HH:mm:ss')}`);
}

// EJECUTAR TODAS LAS PRUEBAS
console.log('='.repeat(60));
verificarTimezoneDelSistema();
ejecutarPruebasCompletas();
simularConsultaBaseDatos();
console.log('='.repeat(60));

// Exportar funciones para uso individual
module.exports = {
    testReagendarCita,
    ejecutarPruebasCompletas,
    verificarTimezoneDelSistema,
    simularConsultaBaseDatos
};