import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { comprimirImagen } from '../utils/comprimir-imagen';

export interface NegocioActual {
  id: number;
  nombre: string;
  logoUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class NegociosService {
  private readonly baseUrl = `${environment.apiUrl}/negocios`;

  constructor(private http: HttpClient) {}

  obtenerActual(): Observable<NegocioActual> {
    return this.http.get<NegocioActual>(`${this.baseUrl}/actual`);
  }

  actualizarNombre(nombre: string): Observable<NegocioActual> {
    return this.http.patch<NegocioActual>(`${this.baseUrl}/actual`, { nombre });
  }

  /**
   * Mismo orquestador de 3 pasos que CuotasService.subirComprobante: comprime
   * la imagen en el navegador (a WebP, para no perder la transparencia; el
   * SVG pasa sin tocar, ver `comprimirImagen`), pide una URL prefirmada, sube
   * el archivo directo al bucket con fetch() nativo (no HttpClient, para que
   * el interceptor de auth no le sume el Bearer de la app y rompa la firma de
   * la URL) y confirma.
   */
  subirLogo(archivo: File): Observable<NegocioActual> {
    return from(comprimirImagen(archivo, { tipoSalida: 'image/webp' })).pipe(
      switchMap((archivoComprimido) =>
        this.http
          .post<{ url: string; key: string }>(`${this.baseUrl}/actual/logo/solicitar-subida`, {
            nombreArchivo: archivoComprimido.name,
            contentType: archivoComprimido.type,
          })
          .pipe(
            switchMap(({ url, key }) =>
              from(
                fetch(url, {
                  method: 'PUT',
                  headers: { 'Content-Type': archivoComprimido.type },
                  body: archivoComprimido,
                }),
              ).pipe(
                map((respuesta) => {
                  if (!respuesta.ok) throw new Error('No se pudo subir el archivo al almacenamiento.');
                  return key;
                }),
              ),
            ),
            switchMap((key) => this.http.post<NegocioActual>(`${this.baseUrl}/actual/logo/confirmar`, { key })),
          ),
      ),
    );
  }

  eliminarLogo(): Observable<NegocioActual> {
    return this.http.delete<NegocioActual>(`${this.baseUrl}/actual/logo`);
  }
}
