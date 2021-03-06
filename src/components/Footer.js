import React from 'react';
import { DefaultFooter } from '@ant-design/pro-layout';
import { GithubOutlined } from '@ant-design/icons';

function Footer() {
  return <DefaultFooter
    className="footer"
    copyright="2020 - Made with 💗 by Anh Thang Bui"
    links={[
      {
        key: 'GitHub',
        title: <GithubOutlined style={{ fontSize: 32 }} />,
        href: process.env.REACT_APP_REPO,
        blankTarget: true,
      },
    ]}
  />
}

export default Footer;