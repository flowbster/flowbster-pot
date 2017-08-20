import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NodePropertiesComponent } from './node-properties.component';

describe('NodePropertiesComponent', () => {
  let component: NodePropertiesComponent;
  let fixture: ComponentFixture<NodePropertiesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NodePropertiesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodePropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
