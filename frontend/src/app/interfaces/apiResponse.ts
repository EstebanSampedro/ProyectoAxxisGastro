  // Interfaz para la respuesta de la API
  export interface ApiResponse {
    success: boolean;
    message?: string;
    data?: any;
  }