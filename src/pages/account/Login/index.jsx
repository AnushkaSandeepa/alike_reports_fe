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
    <>
      {isAuthenticated && <Navigate to={redirectUrl} replace />}

      <PageBreadcrumb title="Login" />
      <AccountWrapper bottomLinks={<BottomLink />}>
        <div className="text-center w-75 m-auto">
          <h4 className="text-dark-50 text-center mt-0 fw-bold">{t('Sign In')}</h4>
          <p className="text-muted mb-4">
            {t('Enter your username and password to access admin panel.')}
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
            <Link to="/account/recover-password" className="text-muted float-end">
              <small>Forgot your password?</small>
            </Link>
          </PasswordInput>

          {/* <CheckInput
            name="rememberme"
            type="checkbox"
            label="Remember me"
            containerClass="mb-3"
            defaultChecked
          /> */}

          <div className="mb-3 text-center">
            <Button variant="primary" type="submit" disabled={loading}>
              {t('Log In')}
            </Button>
          </div>
        </Form>
      </AccountWrapper>
    </>
  );
}
