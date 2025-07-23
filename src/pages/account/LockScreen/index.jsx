import { Link } from 'react-router-dom';
import { Button, Col, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import useLockScreen from './useLockScreen';
import AccountWrapper from '../AccountWrapper';

import { Form, PageBreadcrumb, PasswordInput } from '@/components';

// images
import avatar1 from '@/assets/images/users/avatar-1.jpg';

const BottomLink = () => {
	const { t } = useTranslation();

	return (
		<Row className="mt-3">
			<Col className="text-center">
				<p className="text-muted">
					{t('Not you? return')}
					<Link to={'/account/login'} className="text-muted ms-1">
						<b>{t('Sign In')}</b>
					</Link>
				</p>
			</Col>
		</Row>
	);
};

const LockScreen = () => {
	const { t } = useTranslation();
	const { schema, onSubmit } = useLockScreen();

	return (
		<>
			<PageBreadcrumb title="Lock Screen" />
			<AccountWrapper bottomLinks={<BottomLink />}>
				<div className="text-center w-75 m-auto">
					<img
						src={avatar1}
						height={64}
						alt="user avatar"
						className="rounded-circle shadow"
					/>
					<h4 className="text-dark-50 text-center mt-3 fw-bold">{t('Hi ! Michael ')}</h4>
					<p className="text-muted mb-4">
						{t('Enter your password to access the admin.')}
					</p>
				</div>

				<Form onSubmit={onSubmit} schema={schema}>
					<PasswordInput
						label={t('Password')}
						name="password"
						placeholder={t('Enter your password')}
						containerClass={'mb-3'}
					/>

					<div className="mb-0 text-center">
						<Button variant="primary" type="submit">
							{t('Log In')}
						</Button>
					</div>
				</Form>
			</AccountWrapper>
		</>
	);
};

export default LockScreen;
