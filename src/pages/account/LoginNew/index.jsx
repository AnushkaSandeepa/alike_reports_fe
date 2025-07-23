import { PageBreadcrumb, Form, PasswordInput, TextInput } from '@/components';
import { Button, Col, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, Navigate } from 'react-router-dom';
import bmw_logo from '@/assets/images/Logos/Alike.png';
import useLogin, { loginFormSchema } from './useLogin';

// const BottomLink = () => {
//   const { t } = useTranslation();

//   return (
//     <Row className="mt-3">
//       <Col className="text-center">
//         <p className="text-muted">
//           {t("Don't have an account?")}
//           <Link to="/account/register" className="text-muted ms-1">
//             <b>{t('Sign Up')}</b>
//           </Link>
//         </p>
//       </Col>
//     </Row>
//   );
// };

export default function LoginNew() {
  const { t } = useTranslation();

  const { loading, login, redirectUrl, isAuthenticated } = useLogin();

  return (
    <>
      {/* {isAuthenticated && <Navigate to={redirectUrl} replace />} */}

      <PageBreadcrumb title="Login" />
        
        <Row>
          <Col md={4}></Col>
          <Col md={4} >
            <div style={{paddingTop:"30px"}}>
              <div className="text-center pt-5">
                <img width={'120px'} src={bmw_logo} alt="BMW Logo" />
              </div>
              <div className="text-center w-75 m-auto" style={{paddingTop:"30px"}}>
              <h4 className="text-dark-50 text-center mt-0 fw-bold">{t('Welcome back!')}</h4>
              <p className="text-muted mb-4">
                {t('Login in to your account')}
              </p>
              </div>

              <Form
                onSubmit={login}
                schema={loginFormSchema}
                defaultValues={{ email: 'hyper@coderthemes.com', password: 'Hyper' }}
              >
                <Row>
                  <Col>
                    <TextInput
                      name="email"
                      label={t('Email Address')}
                      type="email"
                      placeholder={t('Enter your email')}
                      containerClass="mb-3"
                    />
                  </Col>
                </Row>
                <PasswordInput
                  label={t('Password')}
                  name="password"
                  placeholder={t('Enter your password')}
                  containerClass="mb-3"
                >
                  
                </PasswordInput>
                <Link to="/account/recover-password-new" className="text-muted float-end ">
                    <small>Forgot your password?</small>
                  </Link>

                {/* <CheckInput
                  name="rememberme"
                  type="checkbox"
                  label="Remember me"
                  containerClass="mb-3"
                  defaultChecked
                /> */}

                {/* <div className="mb-3 text-center mt-5 ">
                  <button className='login-btn mt-4' type="submit" disabled={loading}>
                    {t('LogIn')}
                  </button>
                </div> */}

                <div className="mb-3 text-center mt-5">
                  <Link to="/dashboard">
                    <button className='login-btn mt-4' disabled={loading}>
                      {t('LogIn')}
                    </button>
                  </Link>
                </div>
                
              </Form>
            </div>
          </Col>
          <Col md={4}></Col>
        </Row>
        <footer className="footer footer-alt">
          {new Date().getFullYear()} © Alike -
          <Link to="https://alike.org.au/" target="_blank">
          alike.org.au
          </Link>
        </footer> 
    </>
  );
}
