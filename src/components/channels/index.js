import React, { Component } from 'react';
import {Checkbox, Table, Tabs} from 'antd';
import moment from 'moment';

import channelStyles from './styles';
import withLayout from '../HOC/withLayout';
import firebase from "../../firebase";
import columns from '../../resources/tableStructure';

const TabPane = Tabs.TabPane;

const fetchOpenChannels = firebase.functions().httpsCallable('fetchOpenChannels');
const fetchGroupChannels = firebase.functions().httpsCallable('fetchGroupChannels');
const fetchChannelMembers = firebase.functions().httpsCallable('fetchChannelMembers');
const fetchBannedAndMutedUsers = firebase.functions().httpsCallable('fetchBannedAndMutedUsers');
const banOrMuteUser = firebase.functions().httpsCallable('banOrMuteUser');
const unBanOrUnMuteUser = firebase.functions().httpsCallable('unBanOrUnMuteUser');


function checkIfUserBannedOrMuted(list, userToCheck) {
    for (let i = 0 ; i < list.length ; i++) {
        console.log(list[i]);
        if (list[i].user_id === userToCheck.user_id) {
            return true;
        }
    }

    return false;
}

function removeUserFromArray(list, userToRemove, callback) {
    for (let i = 0 ; i < list.length ; i++) {
        if (list[i].user_id === userToRemove.user_id) {
            list.splice(i, 1); // remove element from array
            break;
        }
    }
    callback();
}

function debounce(fn, delay) {
    let timer = null;
    return function () {
        let context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
            fn.apply(context, args);
        }, delay);
    };
}

class ChannelManager extends Component {
    constructor(props) {
        super(props);

        this.state = {
            openChannels: [],
            groupChannels: [],
            currentTab: 'openChannels',
            firebaseToken: '',
            isExpanded: false,
            loadingTable: true,
            loadingSubTable: true,
            mobile: false,
        };

        this.expandedGroupRowRender = this.expandedGroupRowRender.bind(this);
        this.expandedOpenRowRender = this.expandedOpenRowRender.bind(this);
        this.handleWindowResize = this.handleWindowResize.bind(this);
    }





    // *** Table Structure *** //





    expandedOpenRowRender = (parentRecord, index, indent, expanded) => {
        const openChannelUsers = parentRecord.participants;
        const columns = [{
            title: 'Email',
            dataIndex: 'user_id',
            key: 'user_id'
        }, {
            title: 'Nickname',
            dataIndex: 'nickname',
            key: 'nickname'
        }, {
            title: 'Status',
            render: (value, record, index) => {
                return <div>{record.is_online ? 'Online' : 'Offline' }</div>
            },
            key: 'is_online'
        }, {
            title: 'Last Online',
            render: (value, record, index) => {
                let humanDate = record.is_online ? 'Now' : moment(record.last_seen_at).format('MMMM Do YYYY');
                return <div>{humanDate}</div>
            },
            key: 'last_online'
        }, {
            title: 'Actions',
            dataIndex: 'operation',
            key: 'operation',
            render: (value, record, index) => (
                <div style={{ width: '100%', float: 'left' }}>
                    <Checkbox
                        className='banUser'
                        style={{ whiteSpace: 'nowrap' }}
                        key='banUser'
                        checked={record.is_banned}
                        onChange={(e) => this.handleUserAction(e, record, parentRecord, 'ban')}
                    >
                        Banned
                    </Checkbox>
                    <Checkbox
                        className='muteUser'
                        style={{ margin: 0, whiteSpace: 'nowrap' }}
                        key='muteUser'
                        checked={record.is_muted}
                        onChange={(e) => this.handleUserAction(e, record, parentRecord, 'mute')}
                    >
                        Muted
                    </Checkbox>
                </div>
            ),
        }];

        const columnsMobile = [{
            title: 'Nickname',
            dataIndex: 'nickname',
            key: 'nickname'
        }, {
            title: 'Actions',
            dataIndex: 'operation',
            key: 'operation',
            render: (value, record, index) => (
                <div style={{ width: '100%', float: 'left' }}>
                    <Checkbox
                        className='banUser'
                        style={{ whiteSpace: 'nowrap' }}
                        key='banUser'
                        checked={record.is_banned}
                        onChange={(e) => this.handleUserAction(e, record, parentRecord, 'ban')}
                    >
                        Banned
                    </Checkbox>
                    <Checkbox
                        className='muteUser'
                        style={{ margin: 0, whiteSpace: 'nowrap' }}
                        key='muteUser'
                        checked={record.is_muted}
                        onChange={(e) => this.handleUserAction(e, record, parentRecord, 'mute')}
                    >
                        Muted
                    </Checkbox>
                </div>
            ),
        }];

        return <Table dataSource={openChannelUsers}  columns={!this.state.mobile ? columns : columnsMobile} />
    };

    expandedGroupRowRender = (parentRecord, index, indent, expanded) => {
        const groupChannelUsers = parentRecord.members;
        const bannedUsers = parentRecord.bannedMembers;
        const mutedUsers = parentRecord.mutedMembers;
        const columns = [{
            title: 'Email',
            className: 'email_column',
            dataIndex: 'user_id',
            key: 'user_id'
        }, {
            title: 'Nickname',
            dataIndex: 'nickname',
            key: 'nickname'
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
            title: 'Actions',
            dataIndex: 'operation',
            key: 'operation',
            render: (value, record, index) => (
                <div style={{ width: '100%', float: 'left' }}>
                    <Checkbox
                        className='banUser'
                        style={{ whiteSpace: 'nowrap' }}
                        key='banUser'
                        checked={parentRecord.bannedMembers ? checkIfUserBannedOrMuted(parentRecord.bannedMembers, record) : null}
                        onChange={(e) => this.handleUserAction(e, record, parentRecord, 'ban')}
                    >
                        Banned
                    </Checkbox>
                    <Checkbox
                        className='muteUser'
                        style={{ margin: 0, whiteSpace: 'nowrap' }}
                        key='muteUser'
                        checked={parentRecord.mutedMembers ? checkIfUserBannedOrMuted(parentRecord.mutedMembers, record) : null}
                        onChange={(e) => this.handleUserAction(e, record, parentRecord, 'mute')}
                    >
                        Muted
                    </Checkbox>
                </div>
            ),
        }];

        const columnsMobile = [{
            title: 'Nickname',
            dataIndex: 'nickname',
            key: 'nickname'
        }, {
            title: 'Actions',
            dataIndex: 'operation',
            key: 'operation',
            render: (value, record, index) => (
                <div style={{ width: '100%', float: 'left' }}>
                    <Checkbox
                        className='banUser'
                        style={{ whiteSpace: 'nowrap' }}
                        key='banUser'
                        checked={parentRecord.bannedMembers ? checkIfUserBannedOrMuted(parentRecord.bannedMembers, record) : null}
                        onChange={(e) => this.handleUserAction(e, record, parentRecord, 'ban')}
                    >
                        Banned
                    </Checkbox>
                    <Checkbox
                        className='muteUser'
                        style={{ margin: 0, whiteSpace: 'nowrap' }}
                        key='muteUser'
                        checked={parentRecord.mutedMembers ? checkIfUserBannedOrMuted(parentRecord.mutedMembers, record) : null}
                        onChange={(e) => this.handleUserAction(e, record, parentRecord, 'mute')}
                    >
                        Muted
                    </Checkbox>
                </div>
            ),
        }];

        return <Table loading={this.state.loadingSubTable} rowKey={record => record.uid} dataSource={groupChannelUsers} columns={!this.state.mobile ? columns : columnsMobile} />
    };




    // *** Handlers *** //




    handleWindowResize() {
        console.log('detected resize');
        if (window.innerWidth <= 760) {
            console.log('mobile');
            this.setState({ mobile: true })
        } else {
            console.log('not mobile');
            this.setState({ mobile: false })
        }
    }

    handleTabChange(key) {
        this.setState({ currentTab: key });
    }

    handleUserAction(e, record, parentRecord, action) {
        console.log(e);
        if (!!parentRecord.firebaseToken) {
            if (e.target.checked) {
                switch (action) {
                    case 'ban':
                        banOrMuteUser({
                            token: parentRecord.firebaseToken,
                            userID: record.user_id,
                            channelType: parentRecord.members ? 'group_channels' : 'open_channels',
                            channel: parentRecord.channel_url,
                            action: 'ban'
                        }).then((data) => {
                            parentRecord.bannedMembers.push(record);
                            this.forceUpdate()
                        });
                        break;
                    case 'mute':
                        banOrMuteUser({
                            token: parentRecord.firebaseToken,
                            userID: record.user_id,
                            channelType: parentRecord.members ? 'group_channels' : 'open_channels',
                            channel: parentRecord.channel_url,
                            action: 'mute'
                        }).then((data) => {
                            parentRecord.mutedMembers.push(record);
                            this.forceUpdate()
                        });
                        break;
                }
            } else {
                switch (action) {
                    case 'ban':
                        unBanOrUnMuteUser({
                            token: parentRecord.firebaseToken,
                            userID: record.user_id,
                            channelType: parentRecord.members ? 'group_channels' : 'open_channels',
                            channel: parentRecord.channel_url,
                            action: 'ban'
                        }).then((data) => {
                            removeUserFromArray(parentRecord.bannedMembers, record, () => {
                                this.forceUpdate()
                            });
                        }).catch(e => {
                            console.log(e);
                        });
                        break;
                    case 'mute':
                        unBanOrUnMuteUser({
                            token: parentRecord.firebaseToken,
                            userID: record.user_id,
                            channelType: parentRecord.members ? 'group_channels' : 'open_channels',
                            channel: parentRecord.channel_url,
                            action: 'mute'
                        }).then((data) => {
                            removeUserFromArray(parentRecord.mutedMembers, record, () => {
                                this.forceUpdate()
                            });
                        }).catch(e => {
                            console.log(e);
                        });
                        break;
                }
            }
        }
    }

    handleRowExpand(isExpanded, record) {
        this.setState({ loadingSubTable: true });
        let isGroupChannel = !!record.member_count;
        if (isExpanded) {
            const channelMembersPromise = fetchChannelMembers({token: this.state.firebaseToken, channel: record.channel_url, isGroupChannel: isGroupChannel}).then((channelMembers) => {
                isGroupChannel ? (
                    record.members = channelMembers.data[0].members
                ) : (
                    record.participants = channelMembers.data[0].participants
                );

                record.firebaseToken = this.state.firebaseToken;
            });

            console.log("running fetch banned");

            const fetchBannedPromise = fetchBannedAndMutedUsers({
                token: this.state.firebaseToken,
                channel: record.channel_url,
                channelType: isGroupChannel ? 'group_channels' : 'open_channels',
                action: 'ban'
            }).then((bannedUsers) => {
                console.log(bannedUsers.data.banned_list);
                record.bannedMembers = bannedUsers.data.banned_list;
            }).catch((e) => {
                console.log(e);
            });

            const fetchMutedPromise = fetchBannedAndMutedUsers({
                token: this.state.firebaseToken,
                channel: record.channel_url,
                channelType: isGroupChannel ? 'group_channels' : 'open_channels',
                action: 'mute'
            }).then((mutedUsers) => {
                console.log(mutedUsers.data.muted_list);

                record.mutedMembers = mutedUsers.data.muted_list;
            }).catch((e) => {
                console.log(e);
            });

            Promise.all([channelMembersPromise, fetchBannedPromise, fetchMutedPromise].map(p => p.catch(e => e))).then(results => {
                this.setState({ isExpanded, loadingSubTable: false });
            }).catch(e => {
                console.log(e);
            })
        }
    }





    // *** Life cycle functions *** //




    componentWillMount() {
        if (window.innerWidth <= 760) {
            this.setState({ mobile: true });
        }
        window.addEventListener("resize", debounce(this.handleWindowResize, 500))
    }

    componentWillReceiveProps(props) {
        if (props.user) {
            const { user } = props;

            user.getIdToken().then((token) => {

                fetchOpenChannels({token: token}).then((channels) => {
                    this.setState({ openChannels: channels.data[0].channels, firebaseToken: token });
                });

                fetchGroupChannels({token: token}).then((channels) => {
                    this.setState({ groupChannels: channels.data[0].channels, loadingTable: false });
                });

            });



        } else {
            this.props.history.push('/');
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', debounce(this.handleWindowResize, 500));
    }

    // *** HTML *** //

    render() {
        const { groupChannels, openChannels, isExpanded, loadingTable } = this.state;

        return (
            <div>
                <Tabs style={{ margin: 0, padding: 0, width: '100%' }} activeKey={this.state.currentTab} onChange={(key) => this.handleTabChange(key)}>
                    <TabPane tab="Open Channels" key="openChannels">
                        <Table
                            loading={loadingTable}
                            dataSource={openChannels}
                            onExpand={(isExpanded, record) => this.handleRowExpand(isExpanded, record)}
                            expandedRowRender={this.expandedOpenRowRender}
                            columns={!this.state.mobile ? columns.openColumns : columns.groupColumnsMobile} />
                    </TabPane>
                    <TabPane tab="Group Channels" key="groupChannels">
                        <Table
                            loading={loadingTable}
                            dataSource={groupChannels}
                            onExpand={(isExpanded, record) => this.handleRowExpand(isExpanded, record)}
                            expandedRowRender={this.expandedGroupRowRender}
                            columns={!this.state.mobile ? columns.groupColumns : columns.groupColumnsMobile} />
                    </TabPane>
                </Tabs>
                <style>{channelStyles}</style>
            </div>
        )
    }
}

export default withLayout(ChannelManager);