// src/app/services/wompi.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WompiService {
  private publicKey = environment.WOMPI_CONFIGURATION.publicKey ; //'pub_test_XXXXXXXXXXXXXXXXXXX';   // Reemplaza con tu llave pública
  private privateKey = environment.WOMPI_CONFIGURATION.privateKey; // 'prv_test_XXXXXXXXXXXXXXXXXXX'; // Reemplaza con tu llave privada
  private apiUrl = environment.WOMPI_CONFIGURATION.apiUrl; //'https://sandbox.wompi.co/v1';

  constructor(private http: HttpClient) {}

  /**
   * Crea un token de tarjeta de crédito
   */
  createCardToken(card: {
    number: string;
    cvc: string;
    exp_month: string;
    exp_year: string;
    card_holder: string;
  }) {
    const url = `${this.apiUrl}/tokens/cards`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.publicKey}`,
    });

    return this.http.post<any>(url, card, { headers });
  }

  /**
   * Crea una transacción
   */
  chargeCardToken(payload: {
    token: string;
    customer_email: string;
    amount_in_cents: number;
    currency: string;
    reference: string;
    installments?: number;
  }) {
    const url = `${this.apiUrl}/transactions`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.privateKey}`,
    });

    return this.http.post<any>(url, {
      ...payload,
      payment_method: {
        type: 'CARD',
        token: payload.token,
        installments: payload.installments || 1
      }
    }, { headers });
  }
}



/*
Ejemplo de uso
this.wompiService.createCardToken({
  number: '4242424242424242',
  cvc: '123',
  exp_month: '12',
  exp_year: '2026',
  card_holder: 'Pedro Pérez'
}).subscribe(tokenRes => {
  const token = tokenRes.data.id;

  this.wompiService.chargeCardToken({
    token,
    customer_email: 'cliente@correo.com',
    amount_in_cents: 500000, // $5000 COP
    currency: 'COP',
    reference: 'PEDIDO-1234'
  }).subscribe(transactionRes => {
    console.log('💳 Transacción exitosa', transactionRes);
  });
});

*/