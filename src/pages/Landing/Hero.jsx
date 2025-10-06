import { Container, Row, Col, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import bmw_logo from '@/assets/images/Logos/AlikeAnaltica-logo.png';
import useLanding from './useLanding';
import { BarLoader } from 'react-spinners';

const Hero = () => {

	const { showContent, spinnerTime } = useLanding();


	return (
		<section className="hero-section">
			{showContent ?
				<Container className={`hero-contain d-flex justify-content-center text-center ${showContent ? 'show' : ''}`} style={{ marginTop: "100px" }}>
				<div>
				  <img width={'180px'} src={bmw_logo} alt="BMW Logo" />
				  <h1 className="hero-title pt-3">Welcome to !</h1>
				  <p className="mb-4 mt-3 text-white-50 hero-sub-title">Alike Analytica</p>
				  {!spinnerTime ?
					<div className='hero-spinner' >
				  	<BarLoader color="#36d7b7" width={250} />
				  </div>
				  :
				  ""
				  }
				</div>
			  </Container>
		
			:			
			""
			}
			
		</section>
	);
};

export default Hero;
