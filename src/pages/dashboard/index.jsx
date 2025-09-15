import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardBody, CardTitle, Col, Container, Row, Spinner } from 'reactstrap';
import { IoPauseCircleSharp } from "react-icons/io5";
import { BiSolidCarMechanic } from "react-icons/bi";
import InfoCard from '../../components/InfoCard';
import { PageBreadcrumb } from '@/components';
import LineBar from './linebarchart';
import WebsiteDownloadsViz from './websitedownloadchart';
import PlatformBySocialType from './socialMediaReaches';

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

        <Card className="mt-4">
          <CardBody>
            <CardTitle>Facebook Reach</CardTitle>
            <div id="mix-line-bar" className="e-chart">
              <LineBar />
            </div>
          </CardBody>
        </Card>

		{loading ? (
			<div className="py-5 text-center"><Spinner /></div>
		) : error ? (
			<div className="text-danger">Failed to load downloads: {String(error)}</div>
		) : (
			<WebsiteDownloadsViz rows={rows} />
		)}


		<PlatformBySocialType/>
          
      </Container>
    </React.Fragment>
  );
};

export { Dashboard };
