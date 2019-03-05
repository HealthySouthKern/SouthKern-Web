import React, { Component } from 'react';
import moment from 'moment';
import { Table, Button, Modal } from "antd";


import withLayout from '../HOC/withLayout';
import firebase from '../../firebase';
import columns from "../../resources/tableStructure";

const fetchUsers = firebase.functions().httpsCallable('fetchUserList');

class users extends Component {
    constructor(props) {
        super(props);

        this.state = {
            users: [],
            mobile: false,
        }
    }

    userColumns = [{
        title: 'Email',
        dataIndex: 'user_id',
        key: 'user_id',
    }, {
        title: 'Name',
        dataIndex: 'user_name',
        key: 'user_name',
    }, {
        title: 'Status',
        className: 'status_column',
        render: (value, record, index) => {
            return <div>{record.is_online ? 'Online' : 'Offline' }</div>
        },
        key: 'is_online'
    }, {
        title: 'Last Online',
        className: 'last_online_column',
        render: (value, record, index) => {
            let humanDate = record.is_online ? 'Now' : moment(record.last_seen_at).format('MMMM Do YYYY');
            return <div>{humanDate}</div>
        },
        key: 'last_online'
    }, {
        title: 'Action',
        render: (value, record, index) => {
            return <Button onClick={() => this.handleEditUser(record)}>Edit</Button>
        }
    }];

    // *** Handlers *** //

    handleEditUser(record) {

    }

    // *** Lifecycle Functions *** //

    componentWillReceiveProps(props) {
        if (props.user) {

            const user = props.user;

            user.getIdToken().then(token => {
                fetchUsers({token: token}).then(userList => {
                    this.setState({ users: userList.data[0].users });
                })
            })
        }
    }

    render() {
        const { users, loadingTable } = this.state;
        return (
            <div>
                <Table
                    loading={loadingTable}
                    dataSource={users}
                    //onExpand={(isExpanded, record) => this.handleRowExpand(isExpanded, record)}
                    //expandedRowRender={this.expandedGroupRowRender}
                    columns={!this.state.mobile ? this.userColumns : columns.groupColumnsMobile} />
            </div>
        )
    }
}

export default withLayout(users);