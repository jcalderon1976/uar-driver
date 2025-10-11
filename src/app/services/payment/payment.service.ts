import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  private apiURL = 'https://api.pasarela-pagos.com/v1/charge'; // Sustituye con la URL de tu pasarela de pagos

  constructor(private http: HttpClient) { }

  processPayment(paymentData: any): Observable<any> {
    return this.http.post(this.apiURL, paymentData, {
      headers: {
        'Authorization': 'Bearer TU_API_KEY', // Reemplaza con tu API Key de la pasarela
        'Content-Type': 'application/json'
      }
    });
  }

  
  
}