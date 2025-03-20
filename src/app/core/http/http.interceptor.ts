import { HttpInterceptorFn } from '@angular/common/http';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {

  let headers = req.headers;
  const role = localStorage.getItem(`role`);

  const jwtToken = localStorage.getItem(`token-${role}`);

  headers = headers.set('Authorization', 'Bearer ' + jwtToken);

  const modifiedReq = req.clone({
    headers,
    withCredentials: true,
  });

  return next(modifiedReq);
};
