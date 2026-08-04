import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export const COLOR_ACCENTO_DEFAULT = '#FB923C';

interface ColorResponse {
  colorAccento: string | null;
}

@Injectable({ providedIn: 'root' })
export class PreferenciasService {
  private readonly baseUrl = `${environment.apiUrl}/usuarios/mi-color`;

  constructor(private http: HttpClient) {}

  obtenerColor(): Observable<ColorResponse> {
    return this.http.get<ColorResponse>(this.baseUrl);
  }

  actualizarColor(colorAccento: string): Observable<ColorResponse> {
    return this.http.patch<ColorResponse>(this.baseUrl, { colorAccento });
  }

  restablecerColor(): Observable<ColorResponse> {
    return this.http.delete<ColorResponse>(this.baseUrl);
  }
}
