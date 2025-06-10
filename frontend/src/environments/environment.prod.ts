// src/environments/environment.prod.ts
export const environment = {
    production: true,
    api: {
        baseUrl: 'http://192.168.9.8:3000/api', // Cambia esto por tu URL de producción
        endpoints: {
            // Mantenemos la misma estructura de endpoints
            doctores: '/doctores',
            auth: '/auth',
            authAdmin: '/auth/admin',
            authDoctor: '/auth/doctor',

            citas: {
                base: '/citas',
                register: '/citas/register',
                filter: '/citas/filter',
                getAll: '/citas',
                update: '/citas/update',
                delete: '/citas/delete',
                filterByDate: '/citas/byDate',
                filterByDateAndTower: '/citas/byDateAndTower',
                getConsultas: '/citas/consultasByDate',
                getConsultasActive: '/citas/consultasActive',
                getCitasActive: '/citas/citasActive',
            },

            observaciones: {
                base: '/observaciones',
                register: '/observaciones/register',
                filter: '/observaciones/filter',
                getAll: '/observaciones',
                update: '/observaciones/:id',
                delete: '/observaciones/:id',
                byDate: '/observaciones/byDate'
            },

            torres: {
                base: '/torres',
                register: '/torres/register',
                getAll: '/torres',
                getById: '/torres/:id',
                update: '/torres/:id',
                delete: '/torres/:id'
            }
        }
    }
};