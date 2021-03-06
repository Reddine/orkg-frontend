import { useState } from 'react';
import { Button, ButtonGroup, ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import { faProjectDiagram, faPen, faTimes, faFile, faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import RequireAuthentication from 'components/RequireAuthentication/RequireAuthentication';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import ROUTES from 'constants/routes.js';
import { reverse } from 'named-urls';

function PaperMenuBar(props) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <>
            <ButtonGroup className="flex-shrink-0">
                {props.paperLink && (
                    <a href={props.paperLink} className="btn btn-darkblue flex-shrink-0 btn-sm" target="_blank" rel="noopener noreferrer">
                        <Icon icon={faFile} style={{ margin: '2px 4px 0 0' }} /> View paper
                    </a>
                )}
                <Button className="flex-shrink-0" color="darkblue" size="sm" style={{ marginLeft: 1 }} onClick={() => props.toggle('showGraphModal')}>
                    <Icon icon={faProjectDiagram} style={{ margin: '2px 4px 0 0' }} /> Graph view
                </Button>

                {!props.editMode ? (
                    <RequireAuthentication
                        component={Button}
                        className="flex-shrink-0"
                        style={{ marginLeft: 1 }}
                        color="darkblue"
                        size="sm"
                        onClick={() => props.toggle('editMode')}
                    >
                        <Icon icon={faPen} /> Edit
                    </RequireAuthentication>
                ) : (
                    <Button
                        className="flex-shrink-0"
                        style={{ marginLeft: 1 }}
                        color="darkblueDarker"
                        size="sm"
                        onClick={() => props.toggle('editMode')}
                    >
                        <Icon icon={faTimes} /> Stop editing
                    </Button>
                )}
                <ButtonDropdown isOpen={menuOpen} toggle={() => setMenuOpen(v => !v)} nav inNavbar>
                    <DropdownToggle size="sm" color="darkblue" className="px-3 rounded-right" style={{ marginLeft: 2 }}>
                        <Icon icon={faEllipsisV} />
                    </DropdownToggle>
                    <DropdownMenu right>
                        <DropdownItem tag={NavLink} exact to={reverse(ROUTES.RESOURCE, { id: props.id })}>
                            View resource
                        </DropdownItem>
                    </DropdownMenu>
                </ButtonDropdown>
            </ButtonGroup>
        </>
    );
}

PaperMenuBar.propTypes = {
    editMode: PropTypes.bool.isRequired,
    paperLink: PropTypes.string,
    id: PropTypes.string,
    toggle: PropTypes.func.isRequired
};

export default PaperMenuBar;
