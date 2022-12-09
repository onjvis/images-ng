import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ImageFile } from './model/image-file.model';
import { ComparisonMethod } from './model/comparison-method.enum';
import { ColorModel } from './model/color-model.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl: string = 'http://127.0.0.1:5000';

  constructor(private http: HttpClient) {
  }

  uploadImage(file: ImageFile, method: ComparisonMethod, colorModel: ColorModel, binCount: number, params: any): Observable<any> {
    const requestBody = { ...file, method, colorModel, binCount };
    return this.http.post(this.baseUrl, requestBody, { params });
  }
}
