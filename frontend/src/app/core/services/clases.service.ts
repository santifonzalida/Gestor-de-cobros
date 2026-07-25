import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Clase } from '../models/clase.model';

export interface ClaseForm {
  nombre: string;
  icono: string;
}

@Injectable({ providedIn: 'root' })
export class ClasesService {
  private readonly baseUrl = `${environment.apiUrl}/clases`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Clase[]> {
    return this.http.get<Clase[]>(this.baseUrl);
  }

  crear(dto: ClaseForm): Observable<Clase> {
    return this.http.post<Clase>(this.baseUrl, dto);
  }

  actualizar(id: number, dto: ClaseForm): Observable<Clase> {
    return this.http.patch<Clase>(`${this.baseUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}
