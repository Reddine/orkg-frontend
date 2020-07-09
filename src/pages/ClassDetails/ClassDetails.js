import React, { useState, useEffect } from 'react';
import { Container, Table } from 'reactstrap';
import { classesUrl, submitGetRequest, getStatementsByObjectAndPredicate } from 'network';
import InternalServerError from 'components/StaticPages/InternalServerError';
import NotFound from 'components/StaticPages/NotFound';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { reverse } from 'named-urls';
import ROUTES from 'constants/routes.js';
import { useLocation } from 'react-router-dom';

function ClassDetails(props) {
    const location = useLocation();
    const [error, setError] = useState(null);
    const [label, setLabel] = useState('');
    const [template, setTemplate] = useState(null);
    const [uri, setURI] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const findClass = async () => {
            setIsLoading(true);
            try {
                const responseJson = await submitGetRequest(classesUrl + encodeURIComponent(props.match.params.id));
                document.title = `${responseJson.label} - Class - ORKG`;
                // Get the template of the class
                getStatementsByObjectAndPredicate({
                    objectId: props.match.params.id,
                    predicateId: process.env.REACT_APP_TEMPLATE_OF_CLASS
                })
                    .then(statements =>
                        Promise.all(
                            statements
                                .filter(statement => statement.subject.classes?.includes(process.env.REACT_APP_CLASSES_CONTRIBUTION_TEMPLATE))
                                .map(st => st.subject)
                        )
                    )
                    .then(templates => {
                        if (templates.length > 0) {
                            setTemplate(templates[0]);
                        } else {
                            setTemplate(null);
                        }
                    });
                setLabel(responseJson.label);
                setURI(responseJson.uri);
                setIsLoading(false);
                setError(null);
            } catch (err) {
                console.error(err);
                setLabel(null);
                setTemplate(null);
                setError(err);
                setIsLoading(false);
            }
        };
        findClass();
    }, [location, props.match.params.id]);

    return (
        <>
            {isLoading && <Container className="box rounded pt-4 pb-4 pl-5 pr-5 mt-5 clearfix">Loading ...</Container>}
            {!isLoading && error && <>{error.statusCode === 404 ? <NotFound /> : <InternalServerError />}</>}
            {!isLoading && !error && (
                <Container className="mt-5 clearfix">
                    <div className="box clearfix pt-4 pb-4 pl-5 pr-5 rounded">
                        <div className="mb-2">
                            <div className="pb-2 mb-3">
                                <h3 className="" style={{ overflowWrap: 'break-word', wordBreak: 'break-all' }}>
                                    Class:{' '}
                                    {label || (
                                        <i>
                                            <small>No label</small>
                                        </i>
                                    )}
                                </h3>
                            </div>
                        </div>
                        <Table bordered>
                            <tbody>
                                <tr>
                                    <th scope="row">Class ID</th>
                                    <td> {props.match.params.id}</td>
                                </tr>
                                <tr>
                                    <th scope="row">Class URI</th>
                                    <td>
                                        <i>{uri ? <a href={uri}>{uri}</a> : 'Not Defined'}</i>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Template</th>
                                    <td>
                                        {template ? (
                                            <Link to={reverse(ROUTES.CONTRIBUTION_TEMPLATE, { id: template.id })}>{template.label}</Link>
                                        ) : (
                                            <i>Not Defined</i>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                </Container>
            )}
        </>
    );
}

ClassDetails.propTypes = {
    match: PropTypes.shape({
        params: PropTypes.shape({
            id: PropTypes.string.isRequired
        }).isRequired
    }).isRequired
};

export default ClassDetails;