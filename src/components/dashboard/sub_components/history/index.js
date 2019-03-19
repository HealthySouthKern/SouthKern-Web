import React from 'react';
import moment from 'moment';

import historyStyles from './styles';

const historyItem = (props) => {
    const { user_name, action, date } = props;
    let humanDate = moment(date, 'x').format('MMMM Do YYYY, h:mm a');
    let displayNick = user_name.charAt(0).toLocaleUpperCase() + user_name.slice(1);
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