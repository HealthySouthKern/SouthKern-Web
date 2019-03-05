import React, { Component } from 'react';
import { Row, Col, Card, Icon } from 'antd';
import { Line } from 'react-chartjs-2';

import withLayout from '../HOC/withLayout';
import dashboardStyles from "./styles";
import firebase from "../../firebase";

import HistoryItem from '../history';


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
            showChart: false,
        }
    }


    componentWillReceiveProps(props) {
        if (props.user) {

            const user = props.user;
            let data = {};
            let options = {};
            let userCountArray = [];
            let historyArray = [];

            const fetchOpenChannels = firebase.functions().httpsCallable('fetchOpenChannels');
            const fetchGroupChannels = firebase.functions().httpsCallable('fetchGroupChannels');
            const fetchUserList = firebase.functions().httpsCallable('fetchUserList');

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

            user.getIdToken().then((token) => {

                fetchOpenChannels({token: token}).then((channels) => {
                    console.log(channels.data[0].channels);
                    this.setState({openChannels: channels.data[0].channels});
                });

                fetchGroupChannels({token: token}).then((channels) => {
                    console.log(channels.data[0].channels);
                    this.setState({groupChannels: channels.data[0].channels});
                });

                fetchUserList({token: token}).then((users) => {
                    console.log(users.data[0].users);
                    this.setState({userList: users.data[0].users});
                });
            });
        } else {
            this.props.history.push('/');
        }

    }

    render() {
        const { groupChannels, openChannels, userList, chartData, chartOptions, showChart, historyItems } = this.state;
        let activeCount = 0;
        userList.map((user) => {
            if (user.is_online) {
                activeCount++
            }
        });

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
                <Row className='stats_history_wrapper'>
                    <Col className='grid_container' xs={{ span: 1 }} lg={{ span: 1 }}>
                    <Card className='grid_box' style={{ overflowX: 'hidden', overflowY: 'scroll' }}>
                        <h3>Quick Stats</h3>
                        <hr />
                        <span className='data_wrapper'>
                            <p className='data_title'>Total Open Channels</p> <p className='data'>{openChannels.length}</p>
                        </span>
                        <hr />
                        <span className='data_wrapper'>
                            <p className='data_title'>Total Group Channels</p> <p className='data'>{groupChannels.length}</p>
                        </span>
                        <hr />
                        <div className='data_wrapper'>
                            <p className='data_title'>Total Current Users</p> <p className='data'>{userList.length}</p>
                        </div>
                        <hr />
                        <div className='data_wrapper'>
                            <p className='data_title'>Online Users</p> <p className='data'>{activeCount}</p>
                        </div>
                        <hr />
                    </Card>
                    </Col>
                    <Col className='grid_container' xs={{ span: 1, offset: 1 }}>
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