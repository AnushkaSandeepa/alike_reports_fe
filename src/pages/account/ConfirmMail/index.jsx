import { PageBreadcrumb } from '@/components';
import AccountWrapper from '../AccountWrapper';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import mailSent from '@/assets/images/svg/mail_sent.svg';

const ConfirmMail = () => {
	const { t } = useTranslation();

	return (
		<>
			<PageBreadcrumb title="Confirm Mail" />
			<AccountWrapper>
				<div className="text-center m-auto">
					<img src={mailSent} alt="mail sent" height="64" />
					<h4 className="text-dark-50 text-center mt-4 fw-bold">
						{t('Please check your email')}
					</h4>
					<p className="text-muted mb-4">
						{t('A email has been sent to')}&nbsp;
						<b>youremail@domain.com</b>.&nbsp;
						{t(
							'Please check for an email from company and click on the included link to reset your password.'
						)}
					</p>
					<p className="mb-0 text-center">
						<Link className="btn btn-primary" to="/account/login">
							<i className="mdi mdi-home me-1"></i> {t('Back to Login')}
						</Link>
					</p>
				</div>
			</AccountWrapper>
		</>
	);
};

export default ConfirmMail;
