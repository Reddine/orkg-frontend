import React, { Component } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import ResourceDetails, { descriptionSection } from './pages/ResourceDetails'
import PredicateDetails from './pages/PredicateDetails'
import Resources from './pages/Resources'
import SearchResults from './pages/SearchResults'
import AddResource from './pages/AddResource';
import Predicates from './pages/Predicates';
import DefaultLayout from './components/Layout/DefaultLayout';
import ROUTES from './constants/routes.js';
import AddPaper from './components/AddPaper/AddPaper'
import './assets/scss/CustomBootstrap.scss';
import 'react-notifications/lib/notifications.css';
import { ConnectedRouter } from 'connected-react-router'
import Home from './components/Home/Home';
import ViewPaper from './components/ViewPaper/ViewPaper';
import License from './components/StaticPages/License';
import NotFound from './components/StaticPages/NotFound';
import Comparison from './components/Comparison';
import PropTypes from 'prop-types';

export default class App extends Component {
    render() {
        return (
            <ConnectedRouter history={this.props.history}>
                <DefaultLayout>
                    <Switch>
                        <Route exact path={ROUTES.HOME} component={Home} />
                        <Route exact path={ROUTES.RESOURCES} component={Resources} />
                        <Route exact path={ROUTES.ADD_RESOURCE} component={AddResource} />
                        <Route exact path={ROUTES.PREDICATES} component={Predicates} />
                        <Route exact path={ROUTES.ADD_PAPER.GENERAL_DATA} component={AddPaper} />
                        <Route exact path={ROUTES.VIEW_PAPER} component={ViewPaper} /> {/* TODO: slug for the paper title */}
                        <Route exact path={ROUTES.LICENSE} component={License} />
                        <Route exact path={ROUTES.NOT_FOUND} component={NotFound} />
                        <Route exact path={ROUTES.COMPARISON} component={Comparison} /> {/* TODO: slug for the paper title */}

                        {/* Legacy routes, only used for debugging now */}
                        <Route 
                            path={`/resource/:resourceId/:sectionName`}
                            render={({ match }) => {
                                const id = decodeURIComponent(match.params.resourceId);
                                return (
                                    <ResourceDetails {...this.props} id={id} key={id}
                                        sectionName={decodeURIComponent(match.params.sectionName)}
                                    />
                                )
                            }}
                        />
                        <Route 
                            path={`/predicate/:predicateId`} 
                            render={({ match }) => (
                                <PredicateDetails id={decodeURIComponent(match.params.predicateId)} />
                            )}
                        />
                        <Route 
                            path={`/search/:searchTerm`} 
                            render={({ match }) => (
                                <SearchResults term={decodeURIComponent(match.params.searchTerm)} />
                            )}
                        />

                        <Redirect   
                            from={`/resource/:resourceId`}
                            to={`/resource/:resourceId/${descriptionSection}`} 
                        />
                        {/* Don't add routes below this line */}
                        <Route component={NotFound} />
                    </Switch>
                </DefaultLayout>
            </ConnectedRouter>
        )
    }
}

App.propTypes = {
    history: PropTypes.object,
};