const dashboardStyles = `

    .grid_container {
        width: 47.9%;
        height: 250px;
        background-color: white;

    }
    
    .grid_box {
        width: 100%;
        height: 100%;
        background-color: white;
        text-align: left;
    }
    
    .ant-card-body {
        height: 100%;
        width: 100%;
    }
    
    .data_wrapper {
        display: flex;
        flex-direction: row;
        width: 70%;
        margin-top: auto;
        
    }
    
    .data_title {
        margin: 0;
    }
    
    .data {
        position: absolute;
        left: 90%;
        right: 5%;
        text-align: right;
        margin: 0;
    }
    
    hr {
        display: block;
        height: 1px;
        border: 0;
        border-top: 1px solid #ccc;
        margin: 0.5em 0;
        padding: 0;
    }
    
    stats_history_wrapper {
        margin-top: 3%;
        display: flex;
        flex-direction: row ;
    }
    
    .chart_div {
            width: 100%;
            height: 100%;
    }
    
    @media (max-width: 1000px) {
        stats_history_wrapper {
            flex-direction: column;
        }
        
        .grid_container {
            width: 100%;
            margin: auto;
            margin-bottom: 2%;
        }
        
        .chart_div {
            width: 800px;
        }
        
        .card_wrapper {
            width: 800px;
        }
    }
`;

export default dashboardStyles;