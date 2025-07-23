import HttpClient from '../helpers/httpClient';

function AuthService() {
  return {
    login: (values) => {
      return HttpClient.post('/login/', values);
    },
    logout() {
      return HttpClient.post('/logout/', {});
    },
    register: (values) => {
      return HttpClient.post('/register/', values);
    },
    forgetPassword: (values) => {
      return HttpClient.post('/forget-password/', values);
    },
  };
}

export default AuthService();
