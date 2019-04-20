import React, { Component } from 'react';
import { Row, Col, Card, Icon, Input, Button } from 'antd';
import { Line } from 'react-chartjs-2';

import withLayout from '../HOC/withLayout';
import dashboardStyles from "./styles";
import firebase from "../../firebase";
import StatusUpdate from './sub_components/statusUpdate';

import HistoryItem from './sub_components/history';
import SendBirdWidget from "../../js/widget";
import TokenManager from "../../resources/tokenManager";


class dashboard extends Component {
    constructor(props) {
        super(props);

        this.state = {
            openChannels: [],
            groupChannels: [],
            userList: [],
            historyItems: [],
            user: {},
            chartData: {},
            statusUpdates: [],
            statusText: '',
            showChart: false,
        }
    }

    handleStatusPost() {
        const { statusText, statusUpdates } = this.state;

        let now = Date.now();

        firebase.database().ref('statusUpdates').push({
            text: statusText,
            createdAt: now
        });

        statusUpdates.push({text: statusText, createdAt: now});

        this.setState({
            statusText: '',
            statusUpdates
        })
    }

    componentWillMount() {
    }

    componentWillReceiveProps(props) {
        if (props.user) {

            const user = props.user;
            console.log(user);

            SendBirdWidget.startWithConnect(TokenManager.getSendbirdAppId(), user.email, user.displayName);

            let data = {};
            let options = {};
            let userCountArray = [];
            let historyArray = [];

            const fetchOpenChannels = firebase.functions().httpsCallable('fetchOpenChannels');
            const fetchGroupChannels = firebase.functions().httpsCallable('fetchGroupChannels');
            const fetchSendbirdStatisticsData = firebase.functions().httpsCallable('fetchSendbirdStatisticsData');

            firebase.database().ref('analytics/users').once('value').then((userCounts) => {
                Object.keys(userCounts.val()).map((key, index) => {
                    userCountArray[index] = userCounts.val()[key];
                });

                let generatedLabels = [];
                for (let i = 0 ; i < 30 ; i++) {
                    generatedLabels[i ] = i + 1;
                }

                data = {
                    labels: generatedLabels,
                    datasets: [
                        {
                            label: "Users",
                            fillColor: "rgba(220,220,220,0.2)",
                            strokeColor: "rgba(220,220,220,1)",
                            pointColor: "rgba(220,220,220,1)",
                            pointStrokeColor: "#fff",
                            pointHighlightFill: "#fff",
                            pointHighlightStroke: "rgba(220,220,220,1)",
                            data: userCountArray
                        },
                    ]
                };

                options = {
                        title: {
                            display: true,
                            text: 'User Count over the Past Thirty Days'
                        }
                    ,
                    responsive: true,
                    maintainAspectRatio: false,
                    scaleShowGridLines : true,
                    scaleGridLineColor : "rgba(0,0,0,.05)",
                    scaleGridLineWidth : 1,
                    scaleShowHorizontalLines: true,
                    scaleShowVerticalLines: true,
                    bezierCurve : true,
                    bezierCurveTension : 0.4,
                    pointDot : true,
                    pointDotRadius : 4,
                    pointDotStrokeWidth : 1,
                    pointHitDetectionRadius : 20,
                    datasetStroke : true,
                    datasetStrokeWidth : 2,
                    datasetFill : true,
                    offsetGridLines : false,
                    legend: false,
                    multiTooltipTemplate: "<%= datasetLabel %> - <%= value %>"
            };

                this.setState({ chartData: data, chartOptions: options, showChart: true });

            });

            firebase.database().ref('analytics/adminHistory').once('value').then((historyItems) => {
                Object.keys(historyItems.val()).map((key, index) => {
                    historyArray[index] = historyItems.val()[key];
                });

                this.setState({
                    historyItems: historyArray.reverse()
                })
            });

            firebase.database().ref('statusUpdates').once('value').then((statusUpdates) => {
                let tempArray = [];
                if (statusUpdates.val() != null) {
                    Object.keys(statusUpdates.val()).map((key, index) => {
                        tempArray.push(statusUpdates.val()[key]);
                    });

                    this.setState({statusUpdates: tempArray});
                }
            });

            user.getIdToken().then((token) => {

                fetchOpenChannels({token: token}).then((channels) => {
                    console.log(channels.data[0].channels);
                    this.setState({openChannels: channels.data[0].channels});
                });

                fetchGroupChannels({token: token}).then((channels) => {
                    console.log(channels.data[0].channels);
                    this.setState({groupChannels: channels.data[0].channels});
                });

                fetchSendbirdStatisticsData({token: token}).then((dataObj) => {
                    console.log(dataObj)
                    this.setState({sendbirdStatistics: dataObj.data});
                });

                firebase.database().ref('southkernUsers').once('value').then(users => {
                    let tempArray = [];
                    Object.keys(users.val()).map((key, index) => {
                        tempArray[index] = users.val()[key];
                    });
                    this.setState({ userList: tempArray });
                });

            });
        } else {
            this.props.history.push('/');
        }

    }

    render() {
        const { groupChannels, openChannels, userList, sendbirdStatistics, chartData, chartOptions, statusUpdates, showChart, historyItems } = this.state;

        return (
            <div>
                <Row style={{ whiteSpace: 'nowrap', marginBottom: '2%' }}>
                    <Col className='grid_container' xs={{ span: 1 }} lg={{ span: 1 }} style={{ width: '100%', marginLeft: 'auto', marginRight: 'auto', marginTop: '-3%', height: 300 }}>
                        <Card className='grid_box' style={{ overflowX: 'scroll', overflowY: 'hidden' }} bodyStyle={{ width: '100%' }}>
                        {showChart
                            ? (
                                <div className='chart_div'>
                                <Line data={chartData} options={chartOptions} height={0} width={'100%'} style={{ position: 'absolute', width: '100%' , height: '90%', padding: '1%' }} />
                                </div>
                              )
                            : (
                                <div/>
                              )
                        }
                        </Card>
                    </Col>
                </Row>
                <Row className='stats_history_wrapper' style={{ marginBottom: '2%' }}>
                    <Col className='grid_container' xs={{ span: 1 }} lg={{ span: 1 }}>
                    <Card className='grid_box' style={{ overflowX: 'hidden', overflowY: 'scroll' }}>
                        <h3>Quick Stats</h3>
                        <hr />
                        <div className='data_wrapper'>
                            <p className='data_title'>Monthly Active Users</p> <p className='data'>{sendbirdStatistics ? sendbirdStatistics.mau : 0}</p>
                        </div>
                        <hr />
                        <div className='data_wrapper'>
                            <p className='data_title'>Daily Active users</p> <p className='data'>{sendbirdStatistics ? sendbirdStatistics.dau : 0}</p>
                        </div>
                        <hr />
                        <div className='data_wrapper'>
                            <p className='data_title'>Currently Online Users</p> <p className='data'>{sendbirdStatistics ? sendbirdStatistics.ccu : 0}</p>
                        </div>
                        <hr />
                        <div className='data_wrapper'>
                            <p className='data_title'>Total Current Users</p> <p className='data'>{userList.length}</p>
                        </div>
                        <hr />
                        <span className='data_wrapper'>
                            <p className='data_title'>Total Open Channels</p> <p className='data'>{openChannels.length}</p>
                        </span>
                        <hr />
                        <span className='data_wrapper'>
                            <p className='data_title'>Total Group Channels</p> <p className='data'>{groupChannels.length}</p>
                        </span>
                        <hr />
                    </Card>
                    </Col>
                    <Col className='grid_container' xs={{ span: 1, offset: 1 }}>
                        <Card className='grid_box' style={{ overflowX: 'hidden', overflowY: 'scroll' }}>
                            <Input value={this.state.statusText} style={{ marginBottom: '2%' }} onChange={(e) => { this.setState({ statusText: e.target.value })}} placeholder='What is going on in the community?' />
                            <Button style={{ marginBottom: '2%' }} onClick={() => this.handleStatusPost()} >Post Status Update</Button>
                            {statusUpdates ? statusUpdates.map((statusUpdate) => {
                                return <StatusUpdate createdAt={statusUpdate.createdAt} text={statusUpdate.text} />
                            }) : (
                                <div/>
                            )}
                        </Card>
                    </Col>
                </Row>
                <Row className='stats_history_wrapper'>
                    <Col className='grid_container' xs={{ span: 1 }}>
                        <Card className='grid_box' style={{ overflowY: 'scroll', overflowX: 'hidden' }}>
                            {historyItems.map(historyItem => {
                                return <HistoryItem user_name={historyItem.user_name} action={historyItem.action} date={historyItem.date} />
                            })}
                        </Card>
                    </Col>
                </Row>
                <style>{dashboardStyles}</style>
            </div>
        )
    }
}

export default withLayout(dashboard);