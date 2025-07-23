import { CheckInput, Form, PageBreadcrumb, PasswordInput, TextInput } from '@/components';
import AccountWrapper2 from '../AccountWrapper2';
import { useTranslation } from 'react-i18next';
import { Link, Navigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import SocialLogin from '../SocialLogin';
import useRegister from './useRegister';

const BottomLink = () => {
	const { t } = useTranslation();
	return (
		<footer className="footer footer-alt">
			<p className="text-muted">
				{t('Already have account?')}
				<Link to="/account/login2" className="text-muted ms-1">
					<b>{t('Log In')}</b>
				</Link>
			</p>
		</footer>
	);
};

const Register2 = () => {
	const { t } = useTranslation();
	const { loading, register, isAuthenticated, schema } = useRegister();

	return (
		<>
			{isAuthenticated && <Navigate to="/" replace />}

			<PageBreadcrumb title="Register" />
			<AccountWrapper2 bottomLinks={<BottomLink />}>
				<h4 className="mt-0">{t('Free Sign Up')}</h4>
				<p className="text-muted mb-4">
					{t("Don't have an account? Create your account, it takes less than a minute.")}
				</p>

				<Form onSubmit={register} schema={schema}>
					<TextInput
						label={t('Full Name')}
						type="text"
						name="fullname"
						placeholder={t('Enter your name')}
						containerClass={'mb-3'}
					/>
					<TextInput
						label={t('Email address')}
						type="email"
						name="email"
						placeholder={t('Enter your email')}
						containerClass={'mb-3'}
					/>
					<PasswordInput
						label={t('Password')}
						name="password"
						placeholder={t('Enter your password')}
						containerClass={'mb-3'}
					/>

					<PasswordInput
						label={t('Confirm Password')}
						name="password2"
						placeholder={t('Confirm Password')}
						containerClass="mb-3"
					/>

					<CheckInput
						label={
							<>
								I accept
								<Link to="" className="text-muted">
									Terms and Conditions
								</Link>
							</>
						}
						type="checkbox"
						name="checkboxsignup"
						containerClass={'mb-3 text-muted'}
						defaultChecked
					/>

					<div className="mb-0 d-grid text-center">
						<Button variant="primary" type="submit" disabled={loading}>
							<i className="mdi mdi-account-circle"></i> {t('Sign Up')}
						</Button>
					</div>

					<SocialLogin />
				</Form>
			</AccountWrapper2>
		</>
	);
};

export default Register2;
