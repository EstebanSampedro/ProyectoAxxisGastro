// src/app/shared/utils.ts

/**
 * Formatea una fecha en formato yyyy-mm-dd.
 * @param date - Objeto Date a formatear.
 * @returns Fecha en formato yyyy-mm-dd.
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2); // Añade un 0 al principio si es necesario
  const day = ('0' + date.getDate()).slice(-2); // Añade un 0 al principio si es necesario
  return `${year}-${month}-${day}`;
}

/**
 * Convierte una cadena en formato yyyy-mm-dd a un objeto Date.
 * @param dateString - Cadena en formato yyyy-mm-dd.
 * @returns Objeto Date.
 */
export function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-');
  return new Date(+year, +month - 1, +day); // Los meses en Date son base 0
}

/**
 * Valida si un objeto es nulo o indefinido.
 * @param obj - Objeto a validar.
 * @returns true si el objeto es nulo o indefinido, false en caso contrario.
 */
export function isNullOrUndefined(obj: any): boolean {
  return obj === null || obj === undefined;
}


export function obtenerIdDoctorDesdeSessionStorage(): number {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      if (userData.idmedico !== undefined) {
        return parseInt(userData.idmedico);
      } else if (userData.idDoctor2 !== undefined) {
        return parseInt(userData.idDoctor2);
      }
    } catch (error) {
      console.error('Error al parsear el usuario:', error);
    }
  } else {
    console.error('Usuario no encontrado en sessionStorage.');
  }
  // Retorna 0 si no se encuentra el usuario o si ocurre un error
  return 0;
}