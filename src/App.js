/*!
=========================================================
* Muse Ant Design Dashboard - v1.0.0
=========================================================
* Product Page: https://www.creative-tim.com/product/muse-ant-design-dashboard
* Copyright 2021 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/muse-ant-design-dashboard/blob/main/LICENSE.md)
* Coded by Creative Tim
=========================================================
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/
import { Switch, Route, Redirect } from "react-router-dom";
import Home from "./pages/Home";
import Tables from "./pages/Tables";
import Billing from "./pages/Billing";
import Rtl from "./pages/Rtl";
import Profile from "./pages/Profile";
import Main from "./components/layout/Main";
import ReaderConfig from "./pages/ReaderConfig";
import ProductManagement from "./pages/ProductManagement";
import "antd/dist/antd.css";
import "./assets/styles/main.css";
import "./assets/styles/responsive.css";
import Category from "./pages/Category";
import EpcManagement from "./pages/EpcManagement";
import ProductTracking from "./pages/ProductTracking";
import EPCDisplay from "./pages/EPCDisplay";
import ActivityLog from "./pages/ActivityLog";
import Transaction from "./pages/Transaction";

function App() {
  return (
    <div className="App">
      <Switch>
        <Main>
          <Route exact path="/dashboard" component={Home} />
          <Route exact path="/tables" component={Tables} />
          <Route exact path="/category" component={Category} />
          <Route exact path="/epc-management" component={EpcManagement} />
          <Route exact path="/product-tracking" component={ProductTracking} />
          <Route exact path="/product-display" component={EPCDisplay} />
          <Route exact path="/activity-log" component={ActivityLog} />
          <Route exact path="/transaction" component={Transaction} />
          <Route
            exact
            path="/product-management"
            component={ProductManagement}
          />
          <Route exact path="/billing" component={Billing} />
          <Route exact path="/rtl" component={Rtl} />
          <Route exact path="/profile" component={Profile} />
          <Route exact path="/reader-config" component={ReaderConfig} />
          {/* <Redirect from="*" to="/dashboard" /> */}
        </Main>
      </Switch>
    </div>
  );
}

export default App;
