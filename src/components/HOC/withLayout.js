import React, { Component } from 'react';
import { Layout, Menu, Icon } from 'antd';

import layoutStyle from './styles';
import firebase from '../../firebase';
import bhc_logo from '../../resources/assets/bhc_logo_color_splash.png';

const {
    Header, Content, Footer, Sider,
} = Layout;

const bhcUser = JSON.parse(localStorage.getItem('bhc_user'));

function withLayout(ComponentToWrap) {

    return class extends Component {
        constructor(props) {
            super(props);

            this.state = {
                collapsed: false,
                user: {}
            };

            this.handleMenuClick = this.handleMenuClick.bind(this);
            this.displayPageHeader = this.displayPageHeader.bind(this);
        }

        componentWillMount() {

            // User is not authenticated -> route to login
            if (bhcUser === null) {
                this.props.history.push('/');
            }

            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    // User is signed in.
                    this.setState({ user });
                } else {
                    // No user is signed in.
                    this.props.history.push('/');
                }
            }).bind(this);
        }

        handleMenuClick(e) {
            console.log(e.key);
            switch(e.key) {
                case 'logout':
                    firebase.auth().signOut().then(() => {
                        localStorage.clear();
                        this.props.history.push('/');
                    });
                    return;
                case 'channels':
                    this.props.history.push('/channels');
                    return;
                case 'dashboard':
                    this.props.history.push('/dashboard');
                    return;
                case 'users':
                    this.props.history.push('/users');
                    return
                default:
                    return;
            }
        }

        displayPageHeader() {
            const currentPath = this.props.location.pathname.split('/')[1];
            const displayName = bhcUser.user_name.charAt(0).toLocaleUpperCase() + bhcUser.user_name.slice(1);
            switch(currentPath) {
                case 'dashboard':
                    return (
                        <div className='header_div'>
                            <p className='header'>Dashboard</p>
                            <p className='sub_header'>BHC SouthKern - {displayName}</p>
                        </div>
                    );
                case 'channels':
                    return (
                        <div className='header_div'>
                            <p className='header'>Channels</p>
                            <p className='sub_header'>BHC SouthKern - {displayName}</p>
                        </div>
                    );
                case 'users':
                    return (
                        <div className='header_div'>
                            <p className='header'>Users</p>
                            <p className='sub_header'>BHC SouthKern - {displayName}</p>
                        </div>
                    )
            }
        }

        render() {
            return (
                <Layout className='layout_container'>
                    <Sider
                        className='sider_menu'
                        breakpoint="lg"
                        collapsedWidth="0"
                        onBreakpoint={(broken) => { console.log(broken); }}
                        onCollapse={(collapsed, type) => { }}
                    >
                        <div className='logo_container'>
                            <img className="logo" src={bhc_logo} alt='' />
                        </div>
                        <Menu className='layout_menu' onClick={this.handleMenuClick} theme="dark" mode="inline">
                            <Menu.Item key="dashboard">
                                <Icon type="line-chart" />
                                <span className="nav-text">Dashboard</span>
                            </Menu.Item>
                            <Menu.Item key="channels">
                                <Icon type="notification" />
                                <span className="nav-text">Channels</span>
                            </Menu.Item>
                            <Menu.Item key="users">
                                <Icon type="user" />
                                <span className="nav-text">Users</span>
                            </Menu.Item>
                            <Menu.Item key="4">
                                <Icon type="setting" />
                                <span className="nav-text">Settings</span>
                            </Menu.Item>
                            <Menu.Item key="logout">
                                <Icon type="logout" />
                                <span className="nav-text">Log out</span>
                            </Menu.Item>
                        </Menu>
                    </Sider>
                    <Layout>
                        <Header style={{ background: '#fff', padding: 0 }} >
                            {this.displayPageHeader()}
                        </Header>
                        <Content style={{ margin: '24px 16px 0' }}>
                            <div className='content_div' style={{ minHeight: 360 }}>
                                <ComponentToWrap user={this.state.user} {...this.props} />
                            </div>
                        </Content>
                        {/*<Footer className='layout_footer' style={{ textAlign: 'center' }}>*/}
                            {/*BHC Admin Interface v1.0.0*/}
                        {/*</Footer>*/}
                    </Layout>
                    <style>{layoutStyle}</style>
                </Layout>
            )
        }
    }
}

export default withLayout;