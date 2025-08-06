import { CheckInput, Form, PasswordInput, TextInput, PageBreadcrumb } from '@/components';
import { Button, Col, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, Navigate } from 'react-router-dom';
import AccountWrapper from '../AccountWrapper';
import useRegister from './useRegister';

const BottomLink = () => {
	const { t } = useTranslation();

	return (
		<Row className="mt-3">
			<Col className="text-center">
				<p className="text-muted">
					{t('Already have account?')}
					<Link to={'/account/login'} className="text-muted ms-1">
						<b>{t('Log In')}</b>
					</Link>
				</p>
			</Col>
		</Row>
	);
};

export default function Register() {
	const { t } = useTranslation();

	const { loading, register, isAuthenticated, schema } = useRegister();

	return (
		<>
			{isAuthenticated && <Navigate to="/" replace />}
			<PageBreadcrumb title="Register" />
			<AccountWrapper bottomLinks={<BottomLink />}>
				<div className="text-center w-75 m-auto">
					<h4 className="text-dark-50 text-center mt-0 fw-bold">{t('Get Started with Free On Board')}</h4>
					<p className="text-muted mb-4">
						{t(
							"No account yet? Join our Data Analysis Platform in under a minute and unlock your insights."
						)}
					</p>
				</div>

				<Form
					onSubmit={register}
					schema={schema}
					defaultValues={{
						email: 'hyper@coderthemes.com',
						username: 'Hyper',
						password1: 'HyperCoderthemes',
						password2: 'HyperCoderthemes',
					}}
				>
					<TextInput
						label={t('Full Name')}
						type="text"
						name="username"
						placeholder={t('Enter your name')}
						containerClass="mb-3"
					/>
					<TextInput
						label={t('Organization Email Address')}
						type="text"
						name="email"
						placeholder={t('email@alike.org.au')}
						containerClass="mb-3"
					/>

					<TextInput
						label={t('Phone Number')}
						type="text"
						name="phone"
						placeholder={t('04x xxxx xxxx')}
						containerClass="mb-3"
					/>

					<CheckInput
						name="checkbox"
						type="checkbox"
						containerClass="mb-2"
						label={
							<>
								I accept
								<span className="text-muted cursor-pointer">
									Terms and Conditions
								</span>
							</>
						}
						defaultChecked
					/>

					<div className="mb-3 text-center">
						<Button className='btn-alike' type="submit" disabled={loading}>
							{t('Sign Up')}
						</Button>
					</div>
				</Form>
			</AccountWrapper>
		</>
	);
}
