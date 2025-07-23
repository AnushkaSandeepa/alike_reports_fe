import { ReactNode } from 'react';
import { Row, Col, Breadcrumb } from 'react-bootstrap';
import { Helmet } from 'react-helmet';

const PageBreadcrumb = ({ subName, title, children }) => {
  return (
    <>
      <Helmet>
        <title>{title} | Alike WA</title>
      </Helmet>
      {subName && (
        <Row>
          <Col>
            <div className="page-title-box">
              <div className="page-title-right">
                <Breadcrumb listProps={{ className: 'm-0' }}>
                  <Breadcrumb.Item as={'li'}>Hyper</Breadcrumb.Item>
                  <Breadcrumb.Item as={'li'}>{subName}</Breadcrumb.Item>
                  <Breadcrumb.Item as={'li'} active>
                    {title}
                  </Breadcrumb.Item>
                </Breadcrumb>
              </div>
              <h4 className="page-title">
                {title}
                {children ?? null}
              </h4>
            </div>
          </Col>
        </Row>
      )}
    </>
  );
};

export default PageBreadcrumb;
