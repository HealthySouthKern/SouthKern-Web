import React from 'react';
import moment from 'moment';


const openColumns = [{
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
}, {
    title: 'Participants',
    dataIndex: 'participant_count',
    key: 'participant_count',
}, {
    title: 'Date Created',
    render: (value, record, index) => {
        let humanDate = moment.unix(value.created_at).format('MMMM Do YYYY');
        return <div>{humanDate}</div>
    },
    key: 'created_at',
}];

const groupColumns = [{
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
}, {
    title: 'Participants',
    className: 'table_participants_column',
    dataIndex: 'member_count',
    key: 'member_count',
}, {
    title: 'Date Created',
    className: 'table_created_column',
    render: (value, record, index) => {
        let humanDate = moment.unix(value.created_at).format('MMMM Do YYYY');
        return <div>{humanDate}</div>
    },
    key: 'created_at',
}];

const groupColumnsMobile = [{
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
}];

export default { groupColumns: groupColumns, openColumns: openColumns, groupColumnsMobile };