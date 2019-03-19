const channelStyles = `
    .ant-pagination {
        margin: 16px 16px 0 0 !important;
    }
    
    .more_icon {
        -webkit-transform: rotate(90deg);
        -moz-transform: rotate(90deg);
        -o-transform: rotate(90deg);
        -ms-transform: rotate(90deg);
        transform: rotate(90deg);
        
        cursor: pointer;
        font-size: 25px;
    }
    
    @media (max-width: 1000px) {
        .email_column {
            display: hidden !important;
        }
        
        .status_column {
            display: hidden !important;
        }
        
        .last_online_column {
            display: hidden !important;
        }
        
        .table_created_column {
            display: hidden !important;
        }
        
        .table_participants_column {
            display: hidden !important;
        }
    }
`;

export default channelStyles;