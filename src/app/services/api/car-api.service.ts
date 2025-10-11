import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CarApiService {
    private apiUrlgetAllMakes = environment.carMakeUrl;
    carYears: number[] = [];
    carColors: any[] = [];

    constructor(private http: HttpClient) {}

    getAllMakes(): Observable<any[]> {
        return this.http.get<any>(this.apiUrlgetAllMakes).pipe(
            map((response) => {
                // Filtrar make_id entre 0 y 603
                return response.Results.filter((make: any) => make.Make_ID <= 603);
            })
        );
    }

    getModelsForMake(make: string): Observable<any> {
        return this.http.get(environment.carModelApiUrl + `${make}?format=json`);
    }

    getYear(): Observable<any> {
        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year >= 1950; year--) {
            this.carYears.push(year);
        }
        return of(this.carYears);
    }

    getColor(): Observable<any> {
        return of(environment.carColors);
    }

}

function of<T>(object: T[]): Observable<T[]> {
    return new Observable((observer) => {
        observer.next(object);
        observer.complete();
    });
}


