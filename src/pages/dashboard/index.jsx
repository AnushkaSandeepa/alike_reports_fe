import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardBody, CardTitle, Col, Container, Row, Spinner } from 'reactstrap';
import { IoPauseCircleSharp } from "react-icons/io5";
import { BiSolidCarMechanic } from "react-icons/bi";
import InfoCard from '../../components/InfoCard';
import { PageBreadcrumb } from '@/components';
import WebsiteDownloadsViz from './websitedownloadchart';
import PlatformBySocialType from './socialMediaReaches';
import SLO1Charts from './SLO1Charts';
import MetricLineChart from './MetricLineChart';
import FacebookComboChart from './FacebookComboChart';
import InstagramEfficiencyScatter from './InstagramEfficiencyScatter';
import LinkedInComboChart from './LinkedInComboChart';
import NewsletterComboChart from './NewsletterComboChart';

// --- inline hook in the same file ---
function useWebsiteDownloadsInline() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await window.electronAPI.getWebsiteDownloads();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let off = () => {};
    (async () => { await refresh(); })();

    // re-sync when main broadcasts changes
    off = window.electronAPI.on?.("WebsiteDownloads:updated", refresh) || (() => {});
    return () => off();
  }, [refresh]);

  return { rows, loading, error, refresh };
}

const Dashboard = () => {
  const { rows, loading, error } = useWebsiteDownloadsInline();

  const [dataRows, setDataRows] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/social/facebook").then(r=>r.json()),
      fetch("/api/social/instagram").then(r=>r.json()),
      fetch("/api/social/linkedin").then(r=>r.json()),
      fetch("/api/social/newsletter").then(r=>r.json()),
    ]).then(([fb, ig, li, nl]) => {
      // merged array – they’re already normalized to the same schema
      setDataRows([...fb, ...ig, ...li, ...nl]);
    });
  }, []);

  return (
    <React.Fragment>
      <PageBreadcrumb title="Dashboard" />

      <Container className="py-4">
        <Row>
          <Col>
            <Card style={{ background: 'linear-gradient(94deg, #4a71c6ff -36.87%, #4AC6C6 -22.86%, #153986 150.33%)' }}>
              <CardBody>
                <Row>
                  <Col>
                    <InfoCard
                      title={
                        <span className="info-card-title" style={{ fontSize: '24px', fontWeight: '700' }}>
                          Completed <br />Events
                        </span>
                      }
                      body={
                        <span className="info-card-body" style={{ fontSize: '60px', fontWeight: '700', color: '#ACE8E6' }}>
                          100
                        </span>
                      }
                      icon={<BiSolidCarMechanic color="#064d5f" />}
                    />
                  </Col>
                  <Col>
                    <InfoCard
                      title={
                        <span className="info-card-title" style={{ fontSize: '24px', fontWeight: '700' }}>
                          Completed <br />Workshops
                        </span>
                      }
                      body={
                        <span className="info-card-body" style={{ fontSize: '60px', fontWeight: '700', color: '#ACE8E6' }}>
                          85
                        </span>
                      }
                      icon={<IoPauseCircleSharp color="#064d5f" />}
                    />
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>

      <PlatformBySocialType/>

      <FacebookComboChart />

      <InstagramEfficiencyScatter/>

      <LinkedInComboChart />

      <NewsletterComboChart/>

		{loading ? (
			<div className="py-5 text-center"><Spinner /></div>
		) : error ? (
			<div className="text-danger">Failed to load downloads: {String(error)}</div>
		) : (
			<WebsiteDownloadsViz rows={rows} />
		)}

		

    <SLO1Charts />

    

      </Container>
    </React.Fragment>
  );
};

export { Dashboard };
