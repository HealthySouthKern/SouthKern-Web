import React, { Component } from 'react';
import moment from 'moment';
import { Table, Button, Modal, Dropdown, Icon, Menu, Form, Input, Select } from "antd";


import withLayout from '../HOC/withLayout';
import firebase from '../../firebase';
import userStyles from './styles';

const banOrUnbanUserFromApp = firebase.functions().httpsCallable('banOrUnbanUserFromApp');
const updateUserPasswordAndName = firebase.functions().httpsCallable('updateUserPasswordAndName');
const deleteUserFromFirebaseAndSendbird = firebase.functions().httpsCallable('deleteUserFromFirebaseAndSendbird');
const addPerformedAction = firebase.functions().httpsCallable('addPerformedAction');

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

function getUID(record) {
    if (record.uid) {
        return record.uid;
    } else {
        firebase.database().ref(`southkernUsers`).once('value').then(users => {
            Object.keys(users.val()).map((key, index) => {
                if (users.val()[key].sendbirdToken === record.sendbirdToken) {
                    return key;
                }
            })
        })
    }
}

class users extends Component {
    constructor(props) {
        super(props);

        this.state = {
            users: [],
            originalUsers: [],
            mobile: false,
            recordToDelete: null,
            recordToEdit: null,
            deleteModalVisible: false,
            editModalVisible: false,
            firebaseToken: null,
        }

        this.handleWindowResize = this.handleWindowResize.bind(this);
    }

    // *** Table Structure *** //

    tableActionMenu = (record) => {
        return (
            <Menu>
                <Menu.Item>
                    <a target="_blank"
                       rel="noopener noreferrer"
                       onClick={() => {
                           this.setState({
                               editModalVisible: true,
                               recordToEdit: record
                           })
                       }}
                    >
                        Edit
                    </a>
                </Menu.Item>
                <Menu.Item>
                    <a target="_blank"
                       rel="noopener noreferrer"
                       onClick={() => {
                            this.handleUserBan(record);
                       }}
                    >
                        {!record.is_banned ? 'Ban' : 'Unban'}
                    </a>
                </Menu.Item>
                <Menu.Item>
                    <a target="_blank"
                       rel="noopener noreferrer"
                       onClick={() => {
                           this.setState({
                               deleteModalVisible: true,
                               recordToDelete: record });
                       }}
                    >
                        Delete
                    </a>
                </Menu.Item>
            </Menu>
        );
    };

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
        title: 'Last Seen At',
        className: 'last_online_column',
        render: (value, record, index) => {
            let humanDate = record.is_online ? 'Now' : moment(record.last_seen_at).format('MMMM Do YYYY');
            return <div>{humanDate}</div>
        },
        key: 'last_online'
    }, {
        title: '',
        className: 'table_actions',
        render: (value, record, index) => {
            return (
                <Dropdown trigger={['click']} overlay={() => this.tableActionMenu(record)}>
                    <Icon className='more_icon' type='ellipsis' />
                </Dropdown>
            )
        }
    }];

    userColumnsMobile = [this.userColumns[1], this.userColumns[4]];

    // *** Handlers *** //

    handleUserCreate(e) {
        this.setState({
            recordToEdit: null,
            editModalVisible: true,
        })
    }

    handleUserBan(currentRecord) {
        firebase.database().ref('bannedUsers').once('value').then(bannedUsers => {

            let action = 'ban';

            if (this.props.user) {
                this.props.user.getIdToken().then(token => {
                    if (bannedUsers.val() != null) {
                        if (Object.keys(bannedUsers.val()).includes(getUID(currentRecord))) {
                            action = 'unban'
                        } else {
                            action = 'ban'
                        }
                    }

                    firebase.database().ref(`southkernUsers/${getUID(currentRecord)}/is_banned`).set(action === 'ban');

                    // Optimistic UI update
                    currentRecord.is_banned = action === 'ban';

                    banOrUnbanUserFromApp({
                        action: action,
                        token: token,
                        user_uid: getUID(currentRecord)
                    }).then(() => {
                        addPerformedAction({
                            token: this.state.firebaseToken,
                            user_name: this.state.currentUserName,
                            date: Date.now(),
                            action: `${action === 'ban' ? 'banned' : 'unbanned'} ${currentRecord.user_name}`
                        });
                    });
                    this.forceUpdate();
                });
            }
        })
    }

    handleEditModalOk(e, currentRecord) {

        if (this.props.form) {
            const values = this.props.form.getFieldsValue();

            if (currentRecord != null) {

                if (values.user_password != null) {
                    updateUserPasswordAndName({
                        name: currentRecord.user_name,
                        user_uid: getUID(currentRecord),
                        password: values.user_password,
                        token: this.state.firebaseToken
                    })
                }

                // Don't store password in database, it is already stored in firebase auth
                values.user_password = null;

                Object.keys(values).map((key, index) => {
                    currentRecord[key] = values[key];
                });

                firebase.database().ref(`southkernUsers/${getUID(currentRecord)}`).set(currentRecord).then(() => {
                    addPerformedAction({
                        token: this.state.firebaseToken,
                        user_name: this.state.currentUserName,
                        date: Date.now(),
                        action: `edited ${currentRecord.user_name}`
                    });
                });

                this.props.form.resetFields();

                this.setState({ editModalVisible: false });

            } else {
                // If current record does not exist then the user is not being edited. Instead, we will create them.
                // I believe this is an efficient solution because then we can reuse the edit user modal instead of creating
                // a separate modal and handlers.
                this.props.form.validateFields(err => {
                    if (!err) {
                        firebase.auth().createUserWithEmailAndPassword(values.user_id, values.user_password).then(credential => {
                            console.log(credential.user.uid);

                            updateUserPasswordAndName({
                                token: this.state.firebaseToken,
                                password: values.user_password,
                                name: values.user_name,
                                user_uid: credential.user.uid
                            }).then(() => {
                                addPerformedAction({
                                    token: this.state.firebaseToken,
                                    user_name: this.state.currentUserName,
                                    date: Date.now(),
                                    action: `created ${currentRecord.user_name}`
                                });
                            });

                            // Do not want to store passwords in firebase database. But, we want to make sure they can sign into
                            // the mobile app without having to do the account creation process.
                            values.user_password = null;

                            values.uid = credential.user.uid;

                            // Once unique push key has been generated, add it to the user object.
                            firebase.database().ref(`southkernUsers/${credential.user.uid}`).set(values);

                            this.props.form.resetFields();

                            this.setState({ editModalVisible: false });

                        });

                    }
                })
            }
        } else {
            this.setState({ editModalVisible: false });

            //TODO show error if form props does not exist
            console.log('form props missing');
        }

    }

    handleDeleteModalOk = (e, currentRecord) => {
        const { users } = this.state;

        // Optimistic UI update
        for (let i = 0 ; i < users.length ; i++) {
            if (users[i] === currentRecord) {
                users.splice(i , 1);
            }
        }
        deleteUserFromFirebaseAndSendbird({
            token: this.state.firebaseToken,
            email: currentRecord.user_id,
            user_uid: getUID(currentRecord)
        }).then(() => {
            addPerformedAction({
                token: this.state.firebaseToken,
                user_name: this.state.currentUserName,
                date: Date.now(),
                action: `deleted ${currentRecord.user_name}`
            });
        });

        firebase.database().ref(`southkernUsers/${getUID(currentRecord)}`).remove();

        this.setState({ deleteModalVisible: false, users })

    };

    handleModalCancel = (e, modalType) => {
        switch(modalType) {
            case 'delete':
                this.setState({
                    deleteModalVisible: false,
                });
                break;
            case 'edit':
                this.setState({
                    editModalVisible: false,
                });
                break;
            default:
                return;
        }
    };

    handleWindowResize() {
        if (window.innerWidth <= 760) {
            this.setState({ mobile: true })
        } else {
            this.setState({ mobile: false })
        }
    }

    handleSearch(e) {
        const { value } = e.target;
        const { users, originalUsers } = this.state;

        if (value !== '') {
            let filteredUsers = users.filter(obj => Object.keys(obj).some(key => {
                if (obj[key].includes) {
                    return obj[key].includes(value)
                } else {
                    return false;
                }
            }));

            this.setState({ users: filteredUsers });
        } else {
            this.setState({ users: originalUsers });
        }

    }

    // *** Lifecycle Functions *** //

    componentWillMount() {
        if (window.innerWidth <= 760) {
            this.setState({ mobile: true });
        }
        window.addEventListener("resize", debounce(this.handleWindowResize, 500))
    }

    componentWillReceiveProps(props) {
        if (props.user) {

            const user = props.user;

            user.getIdToken().then(token => {
                firebase.database().ref('southkernUsers').once('value').then(users => {
                    let tempArray = [];
                    Object.keys(users.val()).map((key, index) => {
                        tempArray[index] = users.val()[key];
                    });
                    this.setState({ users: tempArray, originalUsers: tempArray, firebaseToken: token, currentUserName: user.displayName });
                })
            })
        }
    }

    render() {
        const { users, loadingTable, recordToDelete, recordToEdit, deleteModalVisible, editModalVisible, createModalVisible } = this.state;
        const { getFieldDecorator } = this.props.form;

        return (
            <div>
                <Modal
                    title="Confirm User Deletion"
                    visible={deleteModalVisible}
                    onCancel={(e) => this.handleModalCancel(e, 'delete')}
                    footer={<span style={{ whiteSpace: 'nowrap' }}>
                        <Button onClick={(e) => this.handleModalCancel(e, 'delete')}>Cancel</Button>
                        <Button onClick={(e) => this.handleDeleteModalOk(e, recordToDelete)} type='danger'>Delete</Button>
                    </span>}
                >
                    <p>Are you sure you want to delete {recordToDelete ? recordToDelete.user_name ? recordToDelete.user_name : 'this user' : null}?</p>
                </Modal>
                <Modal
                    title={`${recordToEdit ? 'Edit' : 'Create'} ${recordToEdit ? recordToEdit.user_name ? recordToEdit.user_name : 'User' : 'User'}`}
                    visible={editModalVisible}
                    onCancel={(e) => this.handleModalCancel(e, 'edit')}
                    footer={<span style={{ whiteSpace: 'nowrap' }}>
                        <Button onClick={(e) => this.handleModalCancel(e, 'edit')}>Cancel</Button>
                        <Button onClick={(e) => this.handleEditModalOk(e, recordToEdit)} type='primary'>{recordToEdit ? 'Apply' : 'Create'}</Button>
                    </span>}
                >
                    <Form layout='vertical'>
                        <Form.Item>
                            {getFieldDecorator('user_id', {
                                initialValue: recordToEdit ? recordToEdit.user_id : null,
                                rules: [{required: true, message: 'Please enter a email'}],
                            })(
                                <Input prefix={<Icon type="user" style={{color: 'rgba(0,0,0,.25)'}}/>} placeholder="Email"/>
                            )}
                        </Form.Item>
                        <Form.Item>
                            {getFieldDecorator('user_name', {
                                initialValue: recordToEdit ? recordToEdit.user_name : null,
                                rules: [{required: true, message: 'Please enter a username.'}]
                            })(
                                <Input prefix={<Icon type="user" style={{color: 'rgba(0,0,0,.25)'}}/>}
                                       placeholder="Username"/>
                            )}
                        </Form.Item>
                        <Form.Item>
                            {getFieldDecorator('user_password', {
                                initialValue: null,
                                rules: [
                                    {required: true, message: 'Please enter a password.'},
                                    {min: 6, message: 'Password must be at least six characters long'}
                                    ]
                            })(
                                <Input type='password' prefix={<Icon type="lock" style={{color: 'rgba(0,0,0,.25)'}}/>}
                                       placeholder="Password"/>
                            )}
                        </Form.Item>
                        <Form.Item>
                            {getFieldDecorator('user_organization', {
                                initialValue: recordToEdit ? recordToEdit.user_organization : null,
                            })(
                                <Input placeholder="User Organization"/>
                            )}
                        </Form.Item>
                        <Form.Item>
                            {getFieldDecorator('user_position', {
                                initialValue: recordToEdit ? recordToEdit.user_position : null,
                            })(
                                <Input placeholder="User Position"/>
                            )}
                        </Form.Item>
                        <Form.Item>
                            {getFieldDecorator('user_type', {
                                initialValue: recordToEdit ? recordToEdit.user_type : 'resident',
                            })(
                                <Select firstActiveValue={recordToEdit ? recordToEdit.user_type : 'resident'} placeholder="User role">
                                    <Select.Option value="admin">Administrator</Select.Option>
                                    <Select.Option value="organization">Organization</Select.Option>
                                    <Select.Option value="resident">Resident</Select.Option>
                                </Select>
                            )}
                        </Form.Item>
                    </Form>
                </Modal>
                <div style={{ whiteSpace: this.state.mobile ? '' : 'nowrap' }}>
                    <Input.Search onChange={(e) => this.handleSearch(e)} type='search' placeholder='Search for people' style={{ width: '75%'}} />
                    <Button
                        onClick={(e) => this.handleUserCreate(e)}
                        style={{ zIndex: 999, marginBottom: 10, marginLeft: this.state.mobile ? 0 : 10, marginTop: this.state.mobile ? 10 : 0 }}
                        size='medium'
                        type='primary'
                        icon='user-add'
                    >
                        Create user
                    </Button>
                </div>
                <Table
                    rowClassName={(record, index) => { return record.is_banned ? 'banned' : 'not_banned'}}
                    loading={loadingTable}
                    dataSource={users}
                    columns={!this.state.mobile ? this.userColumns : this.userColumnsMobile} />
                    <style>{userStyles}</style>
            </div>
        )
    }
}

const wrappedLayout = withLayout(users);

export default Form.create({ name: 'edit_user' })(wrappedLayout);