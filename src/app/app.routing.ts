import { WorkflowComponent } from './workflow/workflow.component';
import { NodeDefComponent } from './node-def/node-def.component';
import { AuthFileComponent } from './auth-file/auth-file.component';
import { EditorComponent } from './editor/editor/editor.component';
import { Routes } from '@angular/router';

import { AuthenticatedUserComponent } from './authenticated-user/authenticated-user.component';

import { DashboardComponent } from './dashboard/dashboard.component';
import { CountryListComponent } from './country-list/country-list.component';
import { CountryDetailComponent } from './country-detail/country-detail.component';
import { CountryMaintComponent } from './country-maint/country-maint.component';
import { SignInComponent } from '../fw/users/sign-in/sign-in.component';
import { RegisterUserComponent } from '../fw/users/register-user/register-user.component';
import { AuthGuard } from './services/auth-guard.service';

export const appRoutes: Routes = [
  { path: 'signin', component: SignInComponent },
  { path: 'register', component: RegisterUserComponent },
  {
    path: 'authenticated', component: AuthenticatedUserComponent, canActivate: [AuthGuard],
    children: [
      {
        path: '', canActivateChild: [AuthGuard],
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', component: DashboardComponent },
          { path: 'country-list/:count', component: CountryListComponent },
          { path: 'country-detail/:id/:operation', component: CountryDetailComponent },
          { path: 'country-maint', component: CountryMaintComponent },
          { path: 'workflow', component: WorkflowComponent },
          { path: 'editor', component: EditorComponent },
          { path: 'authform', component: AuthFileComponent },
          { path: 'nodeform', component: NodeDefComponent }
        ]
      }
    ]
  },
  { path: '', component: SignInComponent },
  { path: '**', component: SignInComponent }
];
