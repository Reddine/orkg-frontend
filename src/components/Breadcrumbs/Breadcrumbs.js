import { useEffect, useState } from 'react';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Container, Card, CardFooter } from 'reactstrap';
import { getParentResearchFields, getStatementsBySubjectAndPredicate } from 'services/backend/statements';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import { faAngleDoubleRight, faAngleDoubleDown, faSpinner, faHome } from '@fortawesome/free-solid-svg-icons';
import { PREDICATES } from 'constants/graphSettings';
import ContentLoader from 'react-content-loader';
import { Link, NavLink } from 'react-router-dom';
import ROUTES from 'constants/routes';
import { reverse } from 'named-urls';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const StyledDropdownItem = styled(DropdownItem)`
    &:active,
    &:active.text-primary {
        color: #fff !important;
    }
`;

function Breadcrumbs(props) {
    const [parentResearchFields, setParentResearchFields] = useState([]);
    const [isOpen, setIsOpen] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSiblings, setIsLoadingSiblings] = useState(false);
    const [siblings, setSiblings] = useState([]);

    useEffect(() => {
        if (props.researchFieldId !== undefined) {
            setIsLoading(true);
            getParentResearchFields(props.researchFieldId)
                .then(result => {
                    setParentResearchFields(result.reverse());
                    setIsLoading(false);
                    setIsOpen(result.map(s => false));
                    setSiblings(result.map(s => []));
                    setIsLoadingSiblings(result.map(s => false));
                })
                .catch(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [props.researchFieldId]);

    const handleClickArrow = index => {
        setIsLoadingSiblings(isLoadingSiblings.map((el, i) => (i === index ? true : el)));
        setIsOpen(isOpen.map((el, i) => (i === index ? !el : false)));
        if (siblings[index] && !siblings[index].length) {
            // get siblings of parent
            getStatementsBySubjectAndPredicate({
                subjectId: parentResearchFields[index].id,
                predicateId: PREDICATES.HAS_SUB_RESEARCH_FIELD
            }).then(subRF => {
                setSiblings(siblings.map((el, i) => (i === index ? subRF.map(s => s.object) : el)));
                setIsLoadingSiblings(isLoadingSiblings.map((el, i) => (i === index ? false : el)));
            });
        } else {
            setIsLoadingSiblings(isLoadingSiblings.map((el, i) => (i === index ? false : el)));
        }
    };

    if (!props.researchFieldId) {
        return null;
    }
    return (
        <Container className="p-0">
            <Card className="border-0">
                <CardFooter className="rounded border-top-0" style={{ fontSize: '95%', backgroundColor: '#dcdee6' }}>
                    {props.researchFieldId &&
                        !isLoading &&
                        parentResearchFields.map((field, index) => (
                            <span key={field.id}>
                                {index !== parentResearchFields.length - 1 || !props.disableLastField ? (
                                    <Link to={index === 0 ? reverse(ROUTES.HOME) : reverse(ROUTES.RESEARCH_FIELD, { researchFieldId: field.id })}>
                                        {index === 0 ? <Icon className="mr-1" icon={faHome} /> : field.label}
                                    </Link>
                                ) : (
                                    field.label
                                )}
                                {index !== parentResearchFields.length - 1 && (
                                    <Dropdown tag="span" isOpen={isOpen[index]} toggle={() => handleClickArrow(index)}>
                                        <DropdownToggle
                                            style={{ cursor: 'pointer', width: '15px', display: 'inline-block' }}
                                            tag="span"
                                            className="flex-1 ml-2 mr-2"
                                        >
                                            <Icon
                                                className={isOpen[index] ? 'mr-1' : ''}
                                                icon={isOpen[index] ? faAngleDoubleDown : faAngleDoubleRight}
                                            />
                                        </DropdownToggle>
                                        <DropdownMenu>
                                            {!isLoadingSiblings[index] ? (
                                                <>
                                                    {siblings[index] &&
                                                        siblings[index].length &&
                                                        siblings[index].map(rf =>
                                                            rf.id !== parentResearchFields[index + 1].id ? (
                                                                <StyledDropdownItem
                                                                    tag={NavLink}
                                                                    key={`rf-${rf.id}`}
                                                                    to={reverse(ROUTES.RESEARCH_FIELD, { researchFieldId: rf.id })}
                                                                    className="text-primary"
                                                                >
                                                                    {rf.label}
                                                                </StyledDropdownItem>
                                                            ) : (
                                                                <DropdownItem key={`rf-${rf.id}`}>{rf.label}</DropdownItem>
                                                            )
                                                        )}
                                                </>
                                            ) : (
                                                <Icon className="ml-3" icon={faSpinner} spin />
                                            )}
                                        </DropdownMenu>
                                    </Dropdown>
                                )}
                            </span>
                        ))}
                    {isLoading && (
                        <ContentLoader
                            height="100%"
                            width="100%"
                            viewBox="0 0 100 2"
                            style={{ width: '100% !important' }}
                            speed={2}
                            backgroundColor="#dcdee6"
                            foregroundColor="#cdced6"
                        >
                            <rect x="0" y="0" rx="0" ry="0" width="100" height="50" />
                        </ContentLoader>
                    )}
                </CardFooter>
            </Card>
        </Container>
    );
}

Breadcrumbs.propTypes = {
    researchFieldId: PropTypes.string,
    disableLastField: PropTypes.bool
};

Breadcrumbs.defaultProps = {
    disableLastField: false
};

export default Breadcrumbs;
