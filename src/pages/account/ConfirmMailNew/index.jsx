import { PageBreadcrumb } from '@/components';
import AccountWrapper from '../AccountWrapper';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import mailSent from '@/assets/images/svg/mail_sent.svg';
import alike_logo from '@/assets/images/Logos/Alike.png';
import { Col, Row } from 'reactstrap';

const ConfirmMailNew = () => {
	const { t } = useTranslation();

	return (
		<>
			<PageBreadcrumb title="Confirm Mail" />
			
			<Row>
          <Col md={4}></Col>
          <Col md={4} >
            <div style={{paddingTop:"30px"}}>
              <div className="text-center pt-5">
                <img width={'100px'} src={alike_logo} alt="BMW Logo" />
                <h2 className='pt-2 pb-4 brand-title'>Alike WA</h2>
              </div>
              <div className="text-center w-75 m-auto" style={{paddingTop:"30px"}}>
              <img className=" text-center pb-3" src={mailSent} alt="mail sent" height="64" />
              <h4 className="text-dark-50 text-center mt-0 fw-bold">{t('Password Reset Link Sent')}</h4>
              
              </div>
			  
              <p className="text-muted mb-4 pt-4">
						
						{t(
							'We have sent an email to ju****@g*****. To reset your password. After you reset your password, proceed with log in.'
						)}
					</p>
            </div>

			<div className="mb-3 pt-5 text-center">
				<Link to="/account/loginnew" >
					<label d style={{color:"#064D5F" , fontWeight:400 }}>
					{t('Retern to Login')}
					</label>
				</Link>
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

export default ConfirmMailNew;
