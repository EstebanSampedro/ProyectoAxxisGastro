// src/environments/environment.ts
export const environment = {
    production: false,
    api: {
        baseUrl: 'http://localhost:3000/api',
        endpoints: {
            doctores: '/doctores',
            auth: '/auth',
            authAdmin: '/auth/admin',
            authDoctor: '/auth/doctor',
            sessionToken: '/session-token',
            citas: {
                getAll: '/citas',
                filter: '/citas/filter',
                filterByDate: '/citas/byDate',
                filterByDateAndTower: '/citas/byDateAndTower',
                register: '/citas/register',
                update: '/citas/update',
                delete: '/citas/delete',
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