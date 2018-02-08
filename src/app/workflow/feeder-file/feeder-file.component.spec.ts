import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FeederFileComponent } from './feeder-file.component';

describe('FeederFileComponent', () => {
  let component: FeederFileComponent;
  let fixture: ComponentFixture<FeederFileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FeederFileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeederFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
