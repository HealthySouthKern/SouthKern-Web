import React, { Component } from 'react';
import { Form, Select, Icon, Button, Switch, Card, Input } from 'antd';

import withLayout from '../HOC/withLayout'
import firebase from '../../firebase';
import settingsStyles from "./styles";

const Option = Select.Option;
const fetchOrUpdateSendbirdSettings = firebase.functions().httpsCallable('fetchOrUpdateSendbirdSettings');

const formItemLayout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 5, offset: 1 },
};

class settings extends Component {
    constructor(props) {
        super(props);

        this.state = {
            sendbirdSettings: null,
            flag: true
        };
    }

    handleSettingsSubmit() {
        if (this.props.form) {
            const values = this.props.form.getFieldsValue();

            // Reconverting from human readable format.
            switch(values.profanity_filter.type) {
                case 'Do nothing':
                    values.profanity_filter.type = 0;
                    break;
                case 'Replace with asterisks':
                    values.profanity_filter.type = 1;
                    break;
                case 'Block messages':
                    values.profanity_filter.type = 2;
                    break;
            }

            switch(values.domain_filter.type) {
                case 'Do nothing':
                    values.domain_filter.type = 0;
                    break;
                case 'Allow only these domains':
                    values.domain_filter.type = 1;
                    break;
                case 'Block these domains':
                    values.domain_filter.type = 2;
                    break;
            }

            switch(values.profanity_triggered_moderation.action) {
                case 'Do nothing':
                    values.profanity_triggered_moderation.action = 0;
                    break;
                case 'Mute user':
                    values.profanity_triggered_moderation.action = 1;
                    break;
                case 'Kick user from channel':
                    values.profanity_triggered_moderation.action = 2;
                    break;
                case 'Ban user from channel':
                    values.profanity_triggered_moderation.action = 3;
                    break;
            }

            values.domain_filter.domains = values.domain_filter.domains.split(',');
            values.profanity_triggered_moderation.count = parseInt(values.profanity_triggered_moderation.count);
            values.profanity_triggered_moderation.duration = parseInt(values.profanity_triggered_moderation.duration * 60);

            console.log(values);

            fetchOrUpdateSendbirdSettings({ token: this.state.firebaseToken, settings: values });
        }
    }

    componentWillReceiveProps(props, nextContext) {
        if (props.user && this.state.flag) {
            props.user.getIdToken().then(token => {
                fetchOrUpdateSendbirdSettings({ token }).then(settings => {
                    console.log(settings);

                    // Conversions so that settings are human readable.
                    switch (settings.data.profanity_filter.type) {
                        case 0:
                            settings.data.profanity_filter.type = 'Do nothing';
                            break;
                        case 1:
                            settings.data.profanity_filter.type = 'Replace with asterisks';
                            break;
                        case 2:
                            settings.data.profanity_filter.type = 'Block messages';
                            break;
                    }

                    switch (settings.data.domain_filter.type) {
                        case 0:
                            settings.data.domain_filter.type = 'Do nothing';
                            break;
                        case 1:
                            settings.data.domain_filter.type = 'Allow only these domains';
                            break;
                        case 2:
                            settings.data.domain_filter.type = 'Block these domains';
                            break;
                    }

                    switch (settings.data.profanity_triggered_moderation.action) {
                        case 0:
                            settings.data.profanity_triggered_moderation.action = 'Do nothing';
                            break;
                        case 1:
                            settings.data.profanity_triggered_moderation.action = 'Mute user';
                            break;
                        case 2:
                            settings.data.profanity_triggered_moderation.action = 'Kick user from channel';
                            break;
                        case 3:
                            settings.data.profanity_triggered_moderation.action = 'Ban user from channel';
                    }

                    this.setState({ sendbirdSettings: settings.data, firebaseToken: token, flag: false });
                })
            })
        }
    }

    render() {
        const { sendbirdSettings } = this.state;
        const { getFieldDecorator } = this.props.form;

        if (!sendbirdSettings)
            return <div/>;

        return (
            <Card style={{ width: '100%'}}>
                <Form { ...formItemLayout } layout='vertical' className="login-form">
                    <Card className='settings_container'>
                    <Form.Item label='Allow new users to see previous messages in channels' colon={false}>
                        {getFieldDecorator('display_past_message', {
                            initialValue: sendbirdSettings.display_past_message.toString()
                        })(
                            <Switch checkedChildren='Yes' unCheckedChildren='No' defaultChecked={sendbirdSettings.display_past_message}/>
                        )}
                    </Form.Item>
                    </Card>
                    <Card className='settings_container'>
                    <Form.Item label='Allow links in chat messages'>
                        {getFieldDecorator('allow_links', {
                            initialValue: sendbirdSettings.allow_links.toString(),
                        })(
                            <Switch checkedChildren='Yes' unCheckedChildren='No' defaultChecked={sendbirdSettings.allow_links}/>
                        )}
                    </Form.Item>
                    </Card>
                    <Card className='settings_container'>
                    <Form.Item label='Filtered keywords' help='Specifies the comma-separated words to filter from chat messages. *word filters all words that end with "word" including "word" itself while word* filters all words that start with "word" including "word" itself.'>
                        {getFieldDecorator('profanity_filter.keywords', {
                            initialValue: sendbirdSettings.profanity_filter.keywords,
                        })(
                            <Input defaultValue={sendbirdSettings.profanity_filter.keywords} placeholder='*sex*, *profanity* ... ' />
                        )}
                    </Form.Item>
                    </Card>
                    <Card className='settings_container'>
                    <Form.Item label='Keyword filter type'>
                        {getFieldDecorator('profanity_filter.type', {
                            initialValue: sendbirdSettings.profanity_filter.type,
                        })(
                            <Select firstActiveValue={sendbirdSettings.profanity_filter.type}>
                                <Option value='Do nothing'>Do nothing</Option>
                                <Option value='Replace with asterisks'>Replace with asterisks</Option>
                                <Option value='Block messages'>Block messages</Option>
                            </Select>
                        )}
                    </Form.Item>
                    </Card>
                    <Card className='settings_container'>
                    <Form.Item label='Filtered domains' help={`Specifies an list of domains to filter from chat messages. Each item of the list should be specified at least with a combination of domain name and TLD (top level domain) like 'amazon.com'.`}>
                        {getFieldDecorator('domain_filter.domains', {
                            initialValue: sendbirdSettings.domain_filter.domains.toString(),
                        })(
                            <Input defaultValue={sendbirdSettings.domain_filter.domains} placeholder={`amazon.com, google.com ...`} />
                        )}
                    </Form.Item>
                    </Card>
                    <Card className='settings_container'>
                    <Form.Item label='Domain filter type'>
                        {getFieldDecorator('domain_filter.type', {
                            initialValue: sendbirdSettings.domain_filter.type,
                        })(
                            <Select firstActiveValue={sendbirdSettings.domain_filter.type}>
                                <Option value='Do nothing'>Do nothing</Option>
                                <Option value='Allow only these domains'>Allow only these domains</Option>
                                <Option value='Block these domains'>Block these domains</Option>
                            </Select>
                        )}
                    </Form.Item>
                    </Card>
                    <Card className='settings_container'>
                    <Form.Item label='Automated profanity moderation count' help='Number of infractions before a user is automatically punished. A value of 0 turns off automated moderation.'>
                        {getFieldDecorator('profanity_triggered_moderation.count', {
                            initialValue: sendbirdSettings.profanity_triggered_moderation.count.toString(),
                        })(
                            <Input defaultValue={sendbirdSettings.profanity_triggered_moderation.count.toString()} />
                        )}
                    </Form.Item>
                    </Card>
                    <Card className='settings_container'>
                    <Form.Item label='Automated profanity moderation duration' help='Minutes before previous infractions are forgotten. If count above is two and the duration is five, then the user will be punished if they commit two infractions within five minutes.'>
                        {getFieldDecorator('profanity_triggered_moderation.duration', {
                            initialValue: sendbirdSettings.profanity_triggered_moderation.duration / 60,
                        })(
                            <Input defaultValue={sendbirdSettings.profanity_triggered_moderation.duration / 60} />
                        )}
                    </Form.Item>
                    </Card>
                    <Card className='settings_container'>
                    <Form.Item label='Automated profanity moderation severity' help='Action to perform when a user commits enough infractions during the specified duration.'>
                        {getFieldDecorator('profanity_triggered_moderation.action', {
                            initialValue: sendbirdSettings.profanity_triggered_moderation.action,
                        })(
                            <Select firstActiveValue={sendbirdSettings.profanity_triggered_moderation.action}>
                                <Option value='Do nothing'>Do nothing</Option>
                                <Option value='Mute user'>Mute user</Option>
                                <Option value='Kick user from channel'>Kick user from channel</Option>
                                <Option value='Ban user from channel'>Ban user from channel</Option>
                            </Select>
                        )}
                    </Form.Item>
                    </Card>
                    <Card className='settings_container' style={{ whiteSpace: 'nowrap' }}>
                    <Button
                        style={{ marginRight: 10 }}
                        onClick={() => {
                        if (this.props.form) {
                            this.props.form.resetFields();
                        }
                    }}>Reset</Button>
                    <Button type='primary' onClick={() => this.handleSettingsSubmit()}>Submit</Button>
                    </Card>
                </Form>
                <style>{settingsStyles}</style>
            </Card>
        )
    }
}

const wrappedComponent = withLayout(settings);

export default Form.create({ name: 'settings_form' })(wrappedComponent);