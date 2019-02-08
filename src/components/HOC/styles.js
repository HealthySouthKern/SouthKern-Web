
const layoutStyle = `

    .layout_container {
        height: 100%;
    }
    
    .sider_menu {
        background-color: #699C45;
    }
    
    .layout_menu {
        background-color:  #57803A;
    }
    
    .logo_container {
        height: 25%:
        width: 100%;
        text-align: center;
    }
    
    .logo {
        width: 60%;
        padding: 5%;
        margin: auto;
    }
    
    .header_div {
        margin: auto auto auto 5%;
        height: 100%;
                line-height: 35px;

        
    }
    
    .header {
        font-size: 175%;
        margin: 0;
        height: 40%;
        position: relative;
    }
    
    .subHeader {
        height: 20%;
        margin: 0;
        position: relative;
    }
    
    .ant-layout-sider-zero-width-trigger {
       background-color: #57803A;
    }
    
    .ant-layout-sider-zero-width-trigger:hover {
        background-color: #57803A;
    }
    
    @media (max-width: 1000px) {
        .ant-layout-sider {
          flex: 0 0 95% !important;
          width: 64px;
          max-width: 100% !important;
          min-width: 100% !important;
        }
        
        .ant-layout-sider-collapsed {
          flex: 0 0 0px !important;
          width: 0px;
          max-width: 0px !important;
          min-width: 0px !important;
        }
        
        .ant-layout-sider-zero-width-trigger {
          left: 0 !important;
          float: left !important;
          z-index: 9999;
        }
        
        .logo {
            width: 40%;
        }
    }
`;

export default layoutStyle