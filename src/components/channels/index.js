import React, { Component } from 'react';
import {Checkbox, Table, Tabs, Icon, Dropdown, Menu, Modal, Button } from 'antd';
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
const freezeChannel = firebase.functions().httpsCallable('freezeChannel');
const deleteChannel = firebase.functions().httpsCallable('deleteChannel');
const addPerformedAction = firebase.functions().httpsCallable('addPerformedAction');


function checkIfUserBannedOrMuted(bannedList = null, mutedList =  null, userToCheck) {
    if (userToCheck) {
        if (bannedList) {
            for (let i = 0; i < bannedList.length; i++) {

                if (bannedList[i].user != null) {
                    if (bannedList[i].user.user_id === userToCheck.user_id) {
                        return true;
                    }
                } else {
                    if (bannedList[i].user_id === userToCheck.user_id) {
                        return true;
                    }
                }
            }
        } else if (mutedList) {
            for (let i = 0; i < mutedList.length; i++) {

                if (mutedList[i].user != null) {
                    if (mutedList[i].user.user_id === userToCheck.user_id) {
                        return true;
                    }
                } else {
                    if (mutedList[i].user_id === userToCheck.user_id) {
                        return true;
                    }
                }
            }
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
            deleteModalVisible: false,
            recordToDelete: null,
        };

        this.handleWindowResize = this.handleWindowResize.bind(this);

        if (columns.openColumns[columns.openColumns.length - 1].title !== '') {
            columns.groupColumns.push({
                title: '',
                className: 'table_actions',
                render: (value, record, index) => {
                    return (
                        <Dropdown trigger={['click']} overlay={() => this.tableActionMenu(record)}>
                            <Icon className='more_icon' type='ellipsis'/>
                        </Dropdown>
                    )
                }
            });

            columns.openColumns.push({
                title: '',
                className: 'table_actions',
                render: (value, record, index) => {
                    return (
                        <Dropdown trigger={['click']} overlay={() => this.tableActionMenu(record)}>
                            <Icon className='more_icon' type='ellipsis'/>
                        </Dropdown>
                    )
                }
            });
        }

    }





    // *** Table Structure *** //




    tableActionMenu = (record) => {
        console.log(record);
       return (
            <Menu>
                <Menu.Item style={{ backgroundColor: record.freeze ? ' #85c1e9 ' : 'white' }}>
                    <a target="_blank"
                       rel="noopener noreferrer"
                       style={{ color: record.freeze ? 'white' : ''}}
                       onClick={() => {
                           freezeChannel({
                               token: this.state.firebaseToken,
                               channel: record.channel_url,
                               channelType: record.member_count ? 'group_channels' : 'open_channels',
                               freeze: !record.freeze
                           }).then((data) => {
                               record.freeze = !record.freeze;
                               addPerformedAction({
                                   token: this.state.firebaseToken,
                                   user_name: this.state.currentUserName,
                                   date: Date.now(),
                                   action: `${record.freeze ? 'froze' : 'defrosted'} channel ${record.name}`
                               });
                               return data;
                           }).catch((e) => {
                               console.log(e);
                           })
                       }}
                    >
                        {!record.freeze ? 'Freeze channel' : 'Defrost channel'}
                    </a>
                </Menu.Item>
                <Menu.Item>
                    <a target="_blank"
                       rel="noopener noreferrer"
                       onClick={() => {
                           this.setState({ deleteModalVisible: true, recordToDelete: record });
                       }}
                    >
                        Delete channel
                    </a>
                </Menu.Item>
            </Menu>
        );
    };

    customExpandIcon(props) {
        if (props.expanded) {
            return <a style={{ color: 'black' }} onClick={e => {
                props.onExpand(props.record, e);
            }
            }><Icon type="minus" /></a>
        } else {
            return <a style={{ color: 'black' }} onClick={e => {
                props.onExpand(props.record, e);
            }
            }><Icon type="plus" /></a>
        }
    }

    expandedOpenRowRender = (parentRecord, index, indent, expanded) => {
        const openChannelUsers = parentRecord.participants;
        let isUserBanned = false;

        const expandedOpenRow = [{
            title: 'Email',
            className: 'email_column',
            dataIndex: 'user_id',
            render: (value, record, index) => {
                if (parentRecord.bannedMembers) {
                    isUserBanned = checkIfUserBannedOrMuted(parentRecord.bannedMembers, parentRecord.mutedMembers, record)
                }
                return {
                    props: {
                        style: { background: isUserBanned ? '#ddd' : '#fff' }
                    },
                    children: <div>{value}</div>
                }
            }
        }, {
            title: 'Username',
            dataIndex: 'nickname',
            render: (value, record, index) => {
                if (parentRecord.bannedMembers) {
                    isUserBanned = checkIfUserBannedOrMuted(parentRecord.bannedMembers, parentRecord.mutedMembers, record)
                }
                return {
                    props: {
                        style: {background: isUserBanned ? '#ddd' : '#fff'}
                    },
                    children: <div>{value}</div>
                }
            }
        }, {
            title: 'Status',
            className: 'status_column',
            render: (value, record, index) => {
                if (parentRecord.bannedMembers) {
                    isUserBanned = checkIfUserBannedOrMuted(parentRecord.bannedMembers, parentRecord.mutedMembers, record)
                }
                return {
                    props: {
                        style: {background: isUserBanned ? '#ddd' : '#fff'}
                    },
                    children: <div>{record.is_online ? 'Online' : 'Offline'}</div>
                }
            },
            key: 'is_online'
        }, {
            title: 'Last Online',
            className: 'last_online_column',
            render: (value, record, index) => {
                if (parentRecord.bannedMembers) {
                    isUserBanned = checkIfUserBannedOrMuted(parentRecord.bannedMembers, parentRecord.mutedMembers, record)
                }
                let humanDate = record.is_online ? 'Now' : moment(record.last_seen_at).format('MMMM Do YYYY');
                return {
                    props: {
                        style: {background: isUserBanned ? '#ddd' : '#fff'}
                    },
                    children: <div>{humanDate}</div>
                }
            },
            key: 'last_online'
        }, {
            title: 'Actions',
            dataIndex: 'operation',
            key: 'operation',
            render: (value, record, index) => {
                if (parentRecord.bannedMembers) {
                    isUserBanned = checkIfUserBannedOrMuted(parentRecord.bannedMembers, parentRecord.mutedMembers, record)
                }
                return {
                    props: {
                        style: {background: isUserBanned ? '#ddd' : '#fff'}
                    },
                    children: <div style={{width: '100%', float: 'left'}}>
                        <Checkbox
                            className='banUser'
                            style={{whiteSpace: 'nowrap'}}
                            key='banUser'
                            checked={parentRecord.bannedMembers ? checkIfUserBannedOrMuted(parentRecord.bannedMembers, null, record) : null}
                            onChange={(e) => this.handleUserAction(e, record, parentRecord, 'ban')}
                        >
                            Banned
                        </Checkbox>
                        <Checkbox
                            className='muteUser'
                            style={{margin: 0, whiteSpace: 'nowrap'}}
                            key='muteUser'
                            checked={parentRecord.mutedMembers ? checkIfUserBannedOrMuted(null, parentRecord.mutedMembers, record) : null}
                            onChange={(e) => this.handleUserAction(e, record, parentRecord, 'mute')}
                        >
                            Muted
                        </Checkbox>
                    </div>
                }
            },
        }];

        const expandedOpenRowMobile = [{
            title: 'Nickname',
            dataIndex: 'user_name',
            key: 'user_name'
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
                        checked={parentRecord.bannedMembers ? checkIfUserBannedOrMuted(parentRecord.bannedMembers, null, record) : null}
                        onChange={(e) => this.handleUserAction(e, record, parentRecord, 'ban')}
                    >
                        Banned
                    </Checkbox>
                    <Checkbox
                        className='muteUser'
                        style={{ margin: 0, whiteSpace: 'nowrap' }}
                        key='muteUser'
                        checked={parentRecord.mutedMembers ? checkIfUserBannedOrMuted(null, parentRecord.mutedMembers, record) : null}
                        onChange={(e) => this.handleUserAction(e, record, parentRecord, 'mute')}
                    >
                        Muted
                    </Checkbox>
                </div>
            ),
        }];

        return <Table size={"middle"} dataSource={openChannelUsers}  columns={!this.state.mobile ? expandedOpenRow : expandedOpenRowMobile} />
    };

    expandedGroupRowRender = (parentRecord, index, indent, expanded) => {
        console.log(parentRecord);
        console.log(index);
        console.log(indent);
            const groupChannelUsers = parentRecord.members;
            let isUserBanned = false;

            const expandedGroupRow = [{
                title: 'Email',
                className: 'email_column',
                dataIndex: 'user_id',
                render: (value, record, index) => {
                    if (parentRecord.bannedMembers) {
                        isUserBanned = checkIfUserBannedOrMuted(parentRecord.bannedMembers, parentRecord.mutedMembers, record)
                    }
                    return {
                        props: {
                            style: { background: isUserBanned ? '#ddd' : '#fff' }
                        },
                        children: <div>{value}</div>
                    }
                }
            }, {
                title: 'Username',
                dataIndex: 'nickname',
                render: (value, record, index) => {
                    if (parentRecord.bannedMembers) {
                        isUserBanned = checkIfUserBannedOrMuted(parentRecord.bannedMembers, parentRecord.mutedMembers, record)
                    }
                    return {
                        props: {
                            style: {background: isUserBanned ? '#ddd' : '#fff'}
                        },
                        children: <div>{value}</div>
                    }
                }
            }, {
                title: 'Status',
                className: 'status_column',
                render: (value, record, index) => {
                    if (parentRecord.bannedMembers) {
                        isUserBanned = checkIfUserBannedOrMuted(parentRecord.bannedMembers, parentRecord.mutedMembers, record)
                    }
                    return {
                        props: {
                            style: {background: isUserBanned ? '#ddd' : '#fff'}
                        },
                        children: <div>{record.is_online ? 'Online' : 'Offline'}</div>
                    }
                },
                key: 'is_online'
            }, {
                title: 'Last Online',
                className: 'last_online_column',
                render: (value, record, index) => {
                    if (parentRecord.bannedMembers) {
                        isUserBanned = checkIfUserBannedOrMuted(parentRecord.bannedMembers, parentRecord.mutedMembers, record)
                    }
                    let humanDate = record.is_online ? 'Now' : moment(record.last_seen_at).format('MMMM Do YYYY');
                    return {
                        props: {
                            style: {background: isUserBanned ? '#ddd' : '#fff'}
                        },
                        children: <div>{humanDate}</div>
                    }
                },
                key: 'last_online'
            }, {
                title: 'Actions',
                dataIndex: 'operation',
                key: 'operation',
                render: (value, record, index) => {
                    if (parentRecord.bannedMembers) {
                        isUserBanned = checkIfUserBannedOrMuted(parentRecord.bannedMembers, parentRecord.mutedMembers, record)
                    }
                    return {
                        props: {
                            style: {background: isUserBanned ? '#ddd' : '#fff'}
                        },
                        children: <div style={{width: '100%', float: 'left'}}>
                            <Checkbox
                                className='banUser'
                                style={{whiteSpace: 'nowrap'}}
                                key='banUser'
                                checked={parentRecord.bannedMembers ? checkIfUserBannedOrMuted(parentRecord.bannedMembers, null, record) : null}
                                onChange={(e) => this.handleUserAction(e, record, parentRecord, 'ban')}
                            >
                                Banned
                            </Checkbox>
                            <Checkbox
                                className='muteUser'
                                style={{margin: 0, whiteSpace: 'nowrap'}}
                                key='muteUser'
                                checked={parentRecord.mutedMembers ? checkIfUserBannedOrMuted(null, parentRecord.mutedMembers, record) : null}
                                onChange={(e) => this.handleUserAction(e, record, parentRecord, 'mute')}
                            >
                                Muted
                            </Checkbox>
                        </div>
                    }
                },
            }];

            const columnsMobile = [{
                title: 'Username',
                dataIndex: 'nickname',
                key: 'nickname'
            }, {
                title: 'Actions',
                dataIndex: 'operation',
                key: 'operation',
                render: (value, record, index) => (
                    <div style={{width: '100%', float: 'left'}}>
                        <Checkbox
                            className='banUser'
                            style={{whiteSpace: 'nowrap'}}
                            key='banUser'
                            checked={parentRecord.bannedMembers ? checkIfUserBannedOrMuted(parentRecord.bannedMembers, null, record) : null}
                            onChange={(e) => this.handleUserAction(e, record, parentRecord, 'ban')}
                        >
                            Banned
                        </Checkbox>
                        <Checkbox
                            className='muteUser'
                            style={{margin: 0, whiteSpace: 'nowrap'}}
                            key='muteUser'
                            checked={parentRecord.mutedMembers ? checkIfUserBannedOrMuted(null, parentRecord.mutedMembers, record) : null}
                            onChange={(e) => this.handleUserAction(e, record, parentRecord, 'mute')}
                        >
                            Muted
                        </Checkbox>
                    </div>
                ),
            }];

            return <Table size={"middle"} loading={this.state.loadingSubTable} rowKey={record => record.uid}
                          dataSource={groupChannelUsers}
                          expandIconAsCell={false}
                          columns={!this.state.mobile ? expandedGroupRow : columnsMobile}/>
    };




    // *** Handlers *** //





    handleDeleteModalOk = (e, currentRecord) => {
        const { groupChannels, openChannels } = this.state;

        let isGroupChannel = !!currentRecord.member_count;

        let channels = isGroupChannel ? groupChannels : openChannels;

        for (let i = 0 ; i < channels.length ; i++) {
            if (channels[i] === currentRecord) {
                channels.splice(i, 1);
            }
        }

        deleteChannel({
            token: this.state.firebaseToken,
            channel: currentRecord.channel_url,
            channelType: currentRecord.member_count ? 'group_channels' : 'open_channels',
        }).then((data) => {
            addPerformedAction({
                token: this.state.firebaseToken,
                user_name: this.state.currentUserName,
                date: Date.now(),
                action: `deleted channel ${currentRecord.name}`
            });

            return data.data;
        });

        if (isGroupChannel) {
            this.setState({
                deleteModalVisible: false,
                groupChannels: channels
            });
        } else {
            this.setState({
                deleteModalVisible: false,
                openChannels: channels
            })
        }
    };

    handleDeleteModalCancel = (e) => {
        this.setState({
            deleteModalVisible: false,
        });
    };

    handleWindowResize() {
        if (window.innerWidth <= 760) {
            this.setState({ mobile: true })
        } else {
            this.setState({ mobile: false })
        }
    }

    handleTabChange(key) {
        this.setState({ currentTab: key });
    }

    handleUserAction(e, record, parentRecord, action) {
        if (!!parentRecord.firebaseToken) {
            if (e.target.checked) {
                switch (action) {
                    case 'ban':
                        parentRecord.bannedMembers.push(record);
                        this.forceUpdate();
                        banOrMuteUser({
                            token: parentRecord.firebaseToken,
                            userID: record.user_id,
                            channelType: parentRecord.members ? 'group_channels' : 'open_channels',
                            channel: parentRecord.channel_url,
                            action: 'ban'
                        }).then((data) => {
                            addPerformedAction({
                                token: this.state.firebaseToken,
                                user_name: this.state.currentUserName,
                                date: Date.now(),
                                action: `banned ${record.nickname} from ${parentRecord.name}`
                            });
                        });
                        break;
                    case 'mute':
                        parentRecord.mutedMembers.push(record);
                        this.forceUpdate();
                        banOrMuteUser({
                            token: parentRecord.firebaseToken,
                            userID: record.user_id,
                            channelType: parentRecord.members ? 'group_channels' : 'open_channels',
                            channel: parentRecord.channel_url,
                            action: 'mute'
                        }).then((data) => {
                            addPerformedAction({
                                token: this.state.firebaseToken,
                                user_name: this.state.currentUserName,
                                date: Date.now(),
                                action: `muted ${record.nickname} in ${parentRecord.name}`
                            });
                        });
                        break;
                }
            } else {
                switch (action) {
                    case 'ban':
                        removeUserFromArray(parentRecord.bannedMembers, record, () => {
                            this.forceUpdate();
                        });
                        unBanOrUnMuteUser({
                            token: parentRecord.firebaseToken,
                            userID: record.user_id,
                            channelType: parentRecord.members ? 'group_channels' : 'open_channels',
                            channel: parentRecord.channel_url,
                            action: 'ban'
                        }).then(() => {
                            addPerformedAction({
                                token: this.state.firebaseToken,
                                user_name: this.state.currentUserName,
                                date: Date.now(),
                                action: `unbanned ${record.nickname} from ${parentRecord.name}`
                            });
                        }).catch(e => {
                            console.log(e);
                        });
                        break;
                    case 'mute':
                        removeUserFromArray(parentRecord.mutedMembers, record, () => {
                            this.forceUpdate();
                        });
                        unBanOrUnMuteUser({
                            token: parentRecord.firebaseToken,
                            userID: record.user_id,
                            channelType: parentRecord.members ? 'group_channels' : 'open_channels',
                            channel: parentRecord.channel_url,
                            action: 'mute'
                        }).then((data) => {
                            addPerformedAction({
                                token: this.state.firebaseToken,
                                user_name: this.state.currentUserName,
                                date: Date.now(),
                                action: `unmuted ${record.nickname} in ${parentRecord.name}`
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
        let isGroupChannel = !!record.member_count;
        if (isExpanded) {
            this.setState({ loadingSubTable: true });

            const channelMembersPromise = fetchChannelMembers({token: this.state.firebaseToken, channel: record.channel_url, isGroupChannel: isGroupChannel}).then((channelMembers) => {
                isGroupChannel ? (
                    record.members = channelMembers.data[0].members
                ) : (
                    record.participants = channelMembers.data[0].participants
                );

                record.firebaseToken = this.state.firebaseToken;
            });

            const fetchBannedPromise = fetchBannedAndMutedUsers({
                token: this.state.firebaseToken,
                channel: record.channel_url,
                channelType: isGroupChannel ? 'group_channels' : 'open_channels',
                action: 'ban'
            }).then((bannedUsers) => {
                record.bannedMembers = bannedUsers.data.banned_list;
                return bannedUsers.data.banned_list;
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
                let bannedUsers = results[1];
                if (isGroupChannel && record) {
                    for (let bannedUser in bannedUsers) {
                        record.members.push(bannedUsers[bannedUser].user);
                    }
                } else {
                    for (let bannedUser in bannedUsers) {
                        record.participants.push(bannedUsers[bannedUser].user);
                    }
                }

                this.setState({ isExpanded, loadingSubTable: false });
            }).catch(e => {
                console.log(e);
            });
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
                    this.setState({ openChannels: channels.data[0].channels, firebaseToken: token, currentUserName: user.displayName });
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
        const { groupChannels, openChannels, loadingTable, deleteModalVisible, recordToDelete } = this.state;

        return (
            <div>
                <Modal
                    title="Confirm Channel Deletion"
                    visible={deleteModalVisible}
                    onOk={this.handleDeleteModalOk}
                    onCancel={this.handleDeleteModalCancel}
                    footer={<span style={{ whiteSpace: 'nowrap' }}>
                        <Button onClick={(e) => this.handleDeleteModalCancel(e)}>Cancel</Button>
                        <Button onClick={(e) => this.handleDeleteModalOk(e, recordToDelete)} type='danger'>Delete</Button>
                    </span>}
                >
                    <p>Are you sure you want to delete {recordToDelete ? recordToDelete.name : 'this channel'}?</p>
                </Modal>
                <Tabs style={{ margin: 0, padding: 0, width: '100%' }} activeKey={this.state.currentTab} onChange={(key) => this.handleTabChange(key)}>
                    <TabPane tab="Open Channels" key="openChannels">
                        <Table
                            expandIcon={(record) => this.customExpandIcon(record)}
                            loading={loadingTable}
                            dataSource={openChannels}
                            onExpand={(isExpanded, record) => this.handleRowExpand(isExpanded, record)}
                            expandedRowRender={(record) => this.expandedOpenRowRender(record)}
                            columns={!this.state.mobile ? columns.openColumns : columns.groupColumnsMobile}
                            rowKey={record => record.channel_url} />
                    </TabPane>
                    <TabPane tab="Group Channels" key="groupChannels">
                        <Table
                            expandIcon={(record) => this.customExpandIcon(record)}
                            loading={loadingTable}
                            dataSource={groupChannels}
                            onExpand={(isExpanded, record) => this.handleRowExpand(isExpanded, record)}
                            expandedRowRender={(record, index, indent) => this.expandedGroupRowRender(record, index, indent)}
                            columns={!this.state.mobile ? columns.groupColumns : columns.groupColumnsMobile}
                            rowKey={record => record.channel_url} />
                    </TabPane>
                </Tabs>
                <style>{channelStyles}</style>
            </div>
        )
    }
}

export default withLayout(ChannelManager);