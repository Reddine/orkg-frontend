import React, { Component } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ListGroup } from 'reactstrap';
import { updateResource, updateLiteral, createLiteral, createLiteralStatement, deleteStatementById } from 'network';
import { connect } from 'react-redux';
import EditItem from './EditItem';
import { loadPaper } from 'actions/viewPaper';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import LoadingOverlay from 'react-loading-overlay';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/free-solid-svg-icons';

const LoadingOverlayStyled = styled(LoadingOverlay)`
    //border-radius: 7px;
    //overflow: hidden;
`;
class EditPaperDialog extends Component {
    constructor(props) {
        super(props);

        this.state = {
            showDialog: false,
            openItem: 'title',
            isLoading: false,
            ...this.getStateFromRedux()
        };
    }

    getStateFromRedux = () => {
        return {
            title: this.props.viewPaper.title,
            publicationMonth: this.props.viewPaper.publicationMonth,
            publicationYear: this.props.viewPaper.publicationYear,
            doi: this.props.viewPaper.doi,
            authors: this.props.viewPaper.authors
        };
    };

    toggleDialog = () => {
        if (!this.state.showDialog) {
            this.setState({
                showDialog: true,
                openItem: 'title',
                ...this.getStateFromRedux()
            });
        } else {
            this.setState({
                showDialog: false
            });
        }
    };

    handleChange = (event, name) => {
        this.setState({ [name]: event.target.value });
    };

    handleSave = async () => {
        this.setState({
            isLoading: true
        });
        let loadPaper = {};

        //title
        updateResource(this.props.viewPaper.paperResourceId, this.state.title);

        //authors
        await this.updateAuthors(this.state.authors); //use await to prevent updating the props, which are needed to check whether authors exist

        //publication month
        this.updateOrCreateLiteral({
            reducerName: 'publicationMonthResourceId',
            value: this.state.publicationMonth,
            predicateIdForCreate: process.env.REACT_APP_PREDICATES_HAS_PUBLICATION_MONTH
        });

        //publication year
        this.updateOrCreateLiteral({
            reducerName: 'publicationYearResourceId',
            value: this.state.publicationYear,
            predicateIdForCreate: process.env.REACT_APP_PREDICATES_HAS_PUBLICATION_YEAR
        });

        //doi
        this.updateOrCreateLiteral({
            reducerName: 'doiResourceId',
            value: this.state.doi,
            predicateIdForCreate: process.env.REACT_APP_PREDICATES_HAS_DOI
        });

        //update redux state with changes, so it is updated on the view paper page
        this.props.loadPaper({
            ...loadPaper,
            title: this.state.title,
            publicationMonth: this.state.publicationMonth,
            publicationYear: this.state.publicationYear,
            doi: this.state.doi,
            authors: this.state.authors
        });

        this.setState({
            isLoading: false
        });

        this.toggleDialog();
    };

    updateOrCreateLiteral = async ({ reducerName, value, predicateIdForCreate }) => {
        const literalId = this.props.viewPaper[reducerName];

        if (literalId) {
            updateLiteral(literalId, value);
        } else if (value) {
            // only create a new literal if a value has been provided
            let newLiteral = await this.createNewLiteral(this.props.viewPaper.paperResourceId, predicateIdForCreate, value);
            loadPaper[reducerName] = newLiteral.literalId;
        }
    };

    createNewLiteral = async (resourceId, predicateId, label) => {
        let newLiteral = await createLiteral(label);
        let statement = await createLiteralStatement(resourceId, predicateId, newLiteral.id);

        return {
            literalId: newLiteral.id,
            statementId: statement.id
        };
    };

    // TODO: improve code by using reduce function
    updateAuthors = async () => {
        // check which authors to remove
        for (let author of this.props.viewPaper.authors) {
            let keepAuthor = false;
            for (let existingAuthor of this.state.authors) {
                if (existingAuthor.id === author.id) {
                    keepAuthor = true;
                }
            }

            if (!keepAuthor) {
                deleteStatementById(author.id);
            }
        }

        // check which authors to add
        let authors = this.state.authors;
        for (let [i, author] of this.state.authors.entries()) {
            let authorExists = false;
            for (let existingAuthor of this.props.viewPaper.authors) {
                if (existingAuthor.id === author.id) {
                    authorExists = true;
                }
            }

            if (!authorExists) {
                let authorLiteral = await this.createNewLiteral(
                    this.props.viewPaper.paperResourceId,
                    process.env.REACT_APP_PREDICATES_HAS_AUTHOR,
                    author.label
                );
                authors[i].id = authorLiteral.statementId;
            }
        }

        this.setState({
            authors
        });
    };

    toggleItem = type => {
        this.setState(prevState => ({
            openItem: prevState.openItem !== type ? type : null
        }));
    };

    handleAuthorsChange = tags => {
        tags = tags ? tags : [];
        this.setState({
            authors: tags
        });
    };

    render() {
        return (
            <>
                <div className="flex-grow-1">
                    <Button color="darkblue" size="sm" className="mt-2" style={{ marginLeft: 'auto' }} onClick={this.toggleDialog}>
                        <Icon icon={faPen} /> Edit data
                    </Button>
                </div>

                <Modal isOpen={this.state.showDialog} toggle={this.toggleDialog} size="lg">
                    <LoadingOverlayStyled
                        active={this.state.isLoading}
                        spinner
                        text="Saving..."
                        styles={{
                            overlay: base => ({
                                ...base,
                                borderRadius: 7,
                                overflow: 'hidden',
                                background: 'rgba(215, 215, 215, 0.7)',
                                color: '#282828',
                                '& svg circle': {
                                    stroke: '#282828'
                                }
                            })
                        }}
                    >
                        <ModalHeader toggle={this.toggleDialog}>Edit general data</ModalHeader>
                        <ModalBody>
                            <ListGroup className="listGroupEnlarge">
                                <EditItem
                                    open={this.state.openItem === 'title'}
                                    label="Title"
                                    type="text"
                                    value={this.state.title}
                                    onChange={e => this.handleChange(e, 'title')}
                                    toggleItem={() => this.toggleItem('title')}
                                />
                                <EditItem
                                    open={this.state.openItem === 'month'}
                                    label="Publication month"
                                    type="month"
                                    value={this.state.publicationMonth}
                                    onChange={e => this.handleChange(e, 'publicationMonth')}
                                    toggleItem={() => this.toggleItem('month')}
                                />
                                <EditItem
                                    open={this.state.openItem === 'year'}
                                    label="Publication year"
                                    type="year"
                                    value={this.state.publicationYear}
                                    onChange={e => this.handleChange(e, 'publicationYear')}
                                    toggleItem={() => this.toggleItem('year')}
                                />
                                <EditItem
                                    open={this.state.openItem === 'authors'}
                                    label="Authors"
                                    type="authors"
                                    value={this.state.authors}
                                    onChange={this.handleAuthorsChange}
                                    toggleItem={() => this.toggleItem('authors')}
                                />
                                <EditItem
                                    open={this.state.openItem === 'doi'}
                                    isLastItem={true}
                                    label="DOI"
                                    type="text"
                                    value={this.state.doi}
                                    onChange={e => this.handleChange(e, 'doi')}
                                    toggleItem={() => this.toggleItem('doi')}
                                />
                            </ListGroup>

                            <Button color="primary" className="float-right mt-2 mb-2" onClick={this.handleSave}>
                                Save
                            </Button>
                        </ModalBody>
                    </LoadingOverlayStyled>
                </Modal>
            </>
        );
    }
}

EditPaperDialog.propTypes = {
    loadPaper: PropTypes.func.isRequired,
    viewPaper: PropTypes.shape({
        paperResourceId: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        publicationMonth: PropTypes.number.isRequired,
        publicationYear: PropTypes.number.isRequired,
        doi: PropTypes.string.isRequired,
        authors: PropTypes.arrayOf(
            PropTypes.shape({
                id: PropTypes.string.isRequired,
                label: PropTypes.string.isRequired
            }).isRequired
        ).isRequired
    }).isRequired
};

const mapStateToProps = state => ({
    viewPaper: state.viewPaper
});

const mapDispatchToProps = dispatch => ({
    loadPaper: payload => dispatch(loadPaper(payload))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(EditPaperDialog);