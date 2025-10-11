import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Http } from '@capacitor-community/http';
import { environment } from '../../../environments/environment';
import { map, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaypalService {

  private clientId = environment.PAYPAL_CONFIGURATION.clientId; // Cambia esto por tu Client ID de PayPal
  private clientSecret = environment.PAYPAL_CONFIGURATION.secret; // Cambia esto por tu Client Secret de PayPal
  private apiUrl = environment.PAYPAL_CONFIGURATION.apiUrl;  // Cambia a api-m.paypal.com en producción
  private orderId: string = ''; // Inicializa orderId como una cadena vacía

  constructor(private http: HttpClient) { }

  setOrderId(orderId: string) {
    this.orderId= orderId; // Almacena el orderId en la variable de clase
  }
  getOrderId() {
    return this.orderId; // Almacena el orderId en la variable de clase
  }

  // Función para obtener el token de PayPal
  getToken(): Promise<any> {
    const clientId = this.clientId;
    const secret = this.clientSecret;
    
    const auth = btoa(`${clientId}:${secret}`);
  
    const options = {
      url: 'https://api-m.sandbox.paypal.com/v1/oauth2/token',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: 'grant_type=client_credentials'
    };
  
    return Http.post(options);
  }

  // Función para cancelar una orden en PayPal
  cancelOrderCall(orderId: string, accessToken: string): Promise<any> {
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
  
    const options = {
      url: `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/cancel`,
      headers: headers,
      data: {}  // Asegúrate de enviar un cuerpo vacío si es necesario
    };
  
    return Http.post(options);
  }

  // Función para cancelar la orden usando el token obtenido
  cancelOrder(orderId: string): void {
    this.getToken()
      .then(response => {
        const accessToken = response.data.access_token;  // Acceder correctamente al token
        
        return this.cancelOrderCall(orderId, accessToken);
      })
      .then(result => {
        console.log('Order canceled:', result);
      })
      .catch(error => {
        console.error('Error canceling order:', error);
      });
  }

  private getAccessToken() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`)
    });

    const body = new HttpParams()
      .set('grant_type', 'client_credentials');

    return this.http.post(`${this.apiUrl}/v1/oauth2/token`, body, { headers }).pipe(
      map((res: any) => res.access_token)
    );
  }

  public getOrderDetails(orderId: string) {
    return this.getAccessToken().pipe(
      switchMap((token) => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });

        return this.http.get(`${this.apiUrl}/v2/checkout/orders/${orderId}`, { headers });
      })
    );
  }
}
