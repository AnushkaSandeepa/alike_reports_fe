import { Form, PageBreadcrumb, TextInput } from '@/components';
import AccountWrapper from '../AccountWrapper';
import { useTranslation } from 'react-i18next';
import { Button, Col, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import useRecoverPassword from './useRecoverPassword';

const BottomLink = () => {
	const { t } = useTranslation();

	return (
		<Row className="mt-3">
			<Col className="text-center">
				<p className="text-muted">
					{t('Back to')}
					<Link to={'/account/login'} className="text-muted ms-1">
						<b>{t('Log In')}</b>
					</Link>
				</p>
			</Col>
		</Row>
	);
};

const RecoverPassword = () => {
	const { t } = useTranslation();
	const { loading, onSubmit, schema } = useRecoverPassword();

	return (
		<>
			<PageBreadcrumb title="Recover Password" />
			<AccountWrapper bottomLinks={<BottomLink />}>
				<div className="text-center w-75 m-auto">
					<h4 className="text-dark-50 text-center mt-0 fw-bold">{t('Reset Password')}</h4>
					<p className="text-muted mb-4">
						{t(
							"Enter your email address and we'll send you an email with instructions to reset your password."
						)}
					</p>
				</div>

				<Form onSubmit={onSubmit} schema={schema}>
					<TextInput
						label={t('Email Address')}
						type="email"
						name="email"
						placeholder={t('Enter your Email')}
						containerClass={'mb-3'}
					/>

					<div className="mb-0 text-center">
						<Button variant="primary" type="submit" disabled={loading}>
							{t('Reset Password')}
						</Button>
					</div>
				</Form>
			</AccountWrapper>
		</>
	);
};

export default RecoverPassword;
