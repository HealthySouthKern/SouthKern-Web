import React from 'react';
import moment from 'moment';

import { Icon, Row, Col } from 'antd';

const statusUpdateItem = (props) => {
    const { createdAt, text } = props;
    let humanDate = moment(createdAt, 'x').format('MMMM Do YYYY, h:mm a');

    return (
        <div style={{ backgroundColor: '#cc202d', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'row', marginBottom: '2%' }}>
            <div>
                <Icon style={{ color: 'white', fontSize: 30 }} type="message" />
            </div>
            <div style={{ marginLeft: 10, width: '100%'}}>
                <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                    <p style={{ marginBottom: 0, color: 'white', fontSize: 16, fontWeight: 'bold' }}>Status Update</p>
                    <p style={{ marginBottom: 0, color: 'white', marginLeft: 10, fontSize: 16 }}>{humanDate}</p>
                </div>
                <p style={{ color: 'white', margin: 0 }}>{text}</p>
            </div>
        </div>
    )
};

export default statusUpdateItem;