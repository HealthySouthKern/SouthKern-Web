import React from 'react';
import moment from 'moment';

import historyStyles from './styles';

const historyItem = (props) => {
    const { nickname, action, date } = props;
    let humanDate = moment(date, 'x').format('MMMM Do YYYY, h:mm a');
    let displayNick = nickname.charAt(0).toLocaleUpperCase() + nickname.slice(1);
    let historyString = `${displayNick} ${action} on ${humanDate}`;
    return (
        <div className='history_container'>
            <div className='name_date_container'>
                <p className='history'>{historyString}</p>
            </div>
            <style>{historyStyles}</style>
        </div>
    )
};

export default historyItem;