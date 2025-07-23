import { Form, PageBreadcrumb, TextInput } from '@/components';
import AccountWrapper from '../AccountWrapper';
import { useTranslation } from 'react-i18next';
import { Button, Col, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import useRecoverPassword from './useRecoverPassword';
import bmw_logo from '@/assets/images/Logos/Alike.png';

const RecoverPasswordNew = () => {
	const { t } = useTranslation();
	const { loading, onSubmit, schema } = useRecoverPassword();

	return (
		<>
			<PageBreadcrumb title="Recover Password" />
			<Row>
          	<Col md={4}></Col>
          	<Col md={4}>
			  <div style={{paddingTop:"30px"}}>
              <div className="text-center pt-5">
                <img width={'120px'} src={bmw_logo} alt="BMW Logo" />
                <h2 className='pt-2 pb-4 brand-title'>Alike WA</h2>
              </div>
              <div className="text-center w-75 m-auto pt-2">
					<h4 className="text-dark-50 text-center mt-0 fw-bold">{t('Reset Your Password')}</h4>
					<p className="text-muted mb-4 pt-3">
						{t(
							"Enter your username or email and we’ll send you instructions to reset your password."
						)}
					</p>
				</div>
              
			  

				<Form onSubmit={onSubmit} schema={schema}>
					<TextInput
						label={t('Username or email')}
						type="email"
						name="email"
						placeholder={t('Enter Username or Email')}
						containerClass={'mb-3'}
					/>

					{/* <div className="mb-0 text-center">
						<Button variant="primary" type="submit" disabled={loading}>
							{t('Reset Password')}
						</Button>
					</div> */}
					<div className="mb-3 text-center mt-5">
						<Link to="/account/confirm-mail-new">
							<button className='login-btn mt-4' disabled={loading}>
							{t('Send Reset Link')}
							</button>
						</Link>
					</div>

					<div className="mb-3 text-center">
						<Link to="/account/loginnew" >
							<label disabled={loading} style={{color:"#064D5F" , fontWeight:400 }}>
							{t('Retern to Login')}
							</label>
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
};

export default RecoverPasswordNew;
