import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, ReplaySubject } from 'rxjs';

import { ApiService } from './api.service';
import { ColorModel } from './model/color-model.model';
import { ComparisonMethod } from './model/comparison-method.enum';
import { DropdownOption } from './model/dropdown-option.model';
import { ImageFile } from './model/image-file.model';
import { RequestParams } from './model/request-params.model';
import { Result } from './model/result.model';

@UntilDestroy()
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  form!: FormGroup;
  file!: ImageFile;
  results: Result[] = [];

  // template variables
  requiredFieldText: string = 'Required field.';
  ComparisonMethod = ComparisonMethod;
  isLoading = false;

  // Form controls models
  methods!: DropdownOption[];
  weightedModels!: DropdownOption[];
  quadraticFormModels!: DropdownOption[];
  colorModels!: DropdownOption[];
  binCounts!: number[];

  constructor(private api: ApiService, private fb: FormBuilder) { }

  ngOnInit(): void {
    // Initialize form model
    this.form = this.fb.group({
      method: ['', Validators.required],
      colorModel: ['', Validators.required],
      binCount: [256, Validators.required],
      minkowskiParameter: [''],
      weightedModel: [''],
      quadraticFormModel: ['']
    });

    // Initialize form control options
    this.methods = [
      { value: ComparisonMethod.EUCLIDEAN, label: 'Euclidean' },
      { value: ComparisonMethod.MINKOWSKI, label: 'Minkowski' },
      { value: ComparisonMethod.WEIGHTED_EUCLIDEAN, label: 'Weighted Euclidean' },
      { value: ComparisonMethod.QUADRATIC_FORM, label: 'Quadratic Form' },
      { value: ComparisonMethod.BHATTACHARYYA, label: 'Bhattacharyya' }
    ];
    this.weightedModels = [
      { value: 'amplify_green', label: 'Amplify Green' },
      { value: 'amplify_blue', label: 'Amplify Blue' },
      { value: 'amplify_red', label: 'Amplify Red' },
    ];
    this.quadraticFormModels = [
      { value: 'correlated_rgb', label: 'Correlated RGB' }
    ];
    this.colorModels = [
      { value: ColorModel.RGB, label: 'RGB' },
      { value: ColorModel.HSV, label: 'HSV' }
    ];
    this.binCounts = [16, 32, 64, 128, 256];
  }

  handleUpload(event: any): void {
    const file: File = event.target.files[0];
    this.convertFile(file)
      .pipe(untilDestroyed(this))
      .subscribe(image => this.file = { filename: file?.name, image });
  }

  onMethodChanged(method: ComparisonMethod) {
    switch (method) {
      case ComparisonMethod.MINKOWSKI:
        this.minkowskiParameterControl.setValidators(Validators.required);
        this.minkowskiParameterControl.updateValueAndValidity();
        break;
      case ComparisonMethod.WEIGHTED_EUCLIDEAN:
        this.weightedModelControl.setValidators(Validators.required);
        this.weightedModelControl.updateValueAndValidity();
        break;
      case ComparisonMethod.QUADRATIC_FORM:
        this.quadraticFormModelControl.setValidators(Validators.required);
        this.quadraticFormModelControl.updateValueAndValidity();
        break;
      case ComparisonMethod.EUCLIDEAN:
      case ComparisonMethod.BHATTACHARYYA:
      default:
        [this.minkowskiParameterControl, this.weightedModelControl, this.quadraticFormModelControl].forEach(control => {
          control.clearValidators();
          control.updateValueAndValidity();
        });
        break;
    }
  }

  onSubmitClicked(): void {
    const params: RequestParams = {};
    if (this.methodControl.value === ComparisonMethod.MINKOWSKI) {
      params.minkowski = this.minkowskiParameterControl.value;
    } else if (this.methodControl.value === ComparisonMethod.WEIGHTED_EUCLIDEAN) {
      params.weightedModel = this.weightedModelControl.value;
    } else if (this.methodControl.value === ComparisonMethod.QUADRATIC_FORM) {
      params.quadraticFormModel = this.quadraticFormModelControl.value;
    }

    this.isLoading = true;
    this.api.uploadImage(this.file, this.methodControl.value, this.colorModelControl.value, this.binCountControl.value, params)
      .pipe(untilDestroyed(this))
      .subscribe(results => {
        this.results = results;
        this.isLoading = false;
      });
  }

  private convertFile(file: File): Observable<string> {
    const result = new ReplaySubject<string>(1);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      reader.result ? result.next(reader.result?.toString()) : result.next('');
    };
    return result;
  }

  // Form controls getters
  get methodControl(): AbstractControl {
    return this.form.get('method') as AbstractControl;
  }

  get colorModelControl(): AbstractControl {
    return this.form.get('colorModel') as AbstractControl;
  }

  get binCountControl(): AbstractControl {
    return this.form.get('binCount') as AbstractControl;
  }

  get minkowskiParameterControl(): AbstractControl {
    return this.form.get('minkowskiParameter') as AbstractControl;
  }

  get weightedModelControl(): AbstractControl {
    return this.form.get('weightedModel') as AbstractControl;
  }

  get quadraticFormModelControl(): AbstractControl {
    return this.form.get('quadraticFormModel') as AbstractControl;
  }
}
