import { PageBreadcrumb, Form, PasswordInput, TextInput } from '@/components';
import { Button, Col, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, Navigate } from 'react-router-dom';
import AccountWrapper from '../AccountWrapper';
import useLogin, { loginFormSchema } from './useLogin';

const BottomLink = () => {
  const { t } = useTranslation();

  return (
    <Row className="mt-3">
      <Col className="text-center">
        <p className="text-muted">
          {t("Don't have an account?")}
          <Link to="/account/register" className="text-muted ms-1">
            <b>{t('Sign Up')}</b>
          </Link>
        </p>
      </Col>
    </Row>
  );
};

export default function Login() {
  const { t } = useTranslation();

  const { loading, login, redirectUrl, isAuthenticated } = useLogin();

  return (
    <div >
      {isAuthenticated && <Navigate to={redirectUrl} replace />}

      <PageBreadcrumb title="Login" />
      <AccountWrapper bottomLinks={<BottomLink />}>
        <div className="text-center w-75 m-auto ">
          <h4 className="text-dark-50 text-center mt-0 fw-bold">{t('LOGIN')}</h4>
          <p className="text-muted mb-4 pt-2">
            {t('Enter your email and phone number to verify access into Data Analysis platform.')}
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
                label={t('Organization Email Address')}
                type="email"
                placeholder={t('email@alike.org.au')}
                containerClass="mb-3"
              />
            </Col>
          </Row>
          <TextInput
            label={t('Phone Number')}
            name="password"
            placeholder={t('04x xxxx xxxx')}
            containerClass="mb-3"
          >
            
          </TextInput>

          {/* <CheckInput
            name="rememberme"
            type="checkbox"
            label="Remember me"
            containerClass="mb-3"
            defaultChecked
          /> */}

          <div className="mb-3 text-center pt-3" >
            <Button className='btn-alike' type="submit" disabled={loading}>
              {t('Log In')}
            </Button>
          </div>
        </Form>
      </AccountWrapper>
    </div>
  );
}
