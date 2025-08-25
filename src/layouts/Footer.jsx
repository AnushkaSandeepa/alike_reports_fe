import { Col, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function Footer() {
	const currentYear = new Date().getFullYear();
	return (
		<footer className="footer">
			<div className="container-fluid">
				<Row>
					<Col md={6}>{currentYear} © Alike - alike.org.au</Col>
					<Col md={6}>
						<div className="text-md-end footer-links d-none d-md-block">
							<Link to="https://alike.org.au/" target="_blank">
								About
							</Link>
							&nbsp;
							{/* <Link to="https://alike.org.au/contact-us/" target="_blank">
								Support
							</Link> */}
							<a 
								href="https://mail.google.com/mail/?view=cm&fs=1&to=anushkasandeepa111@gmail.com" 
								target="_blank" 
								rel="noopener noreferrer"
								>
								Support
							</a>


							&nbsp;
							<Link to="https://alike.org.au/contact-us/" target="_blank">
								Contact Us
							</Link>
						</div>
					</Col>
				</Row>
			</div>
		</footer>
	);
}
