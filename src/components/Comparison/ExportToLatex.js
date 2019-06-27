import React, { Component } from 'react';
import { Modal, ModalHeader, ModalBody, Input, Button, Nav, NavItem, NavLink, Tooltip as ReactstrapTooltip } from 'reactstrap';
import PropTypes from 'prop-types';
import MakeLatex from 'make-latex';
import styled from 'styled-components';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import { faClipboard } from '@fortawesome/free-regular-svg-icons';
import { CustomInput } from 'reactstrap';
import Tooltip from '../Utils/Tooltip';
import { timeoutPromise } from '../../utils';
import { getStatementsBySubject, crossrefUrl } from '../../network';

const Textarea = styled(Input)`
    font-family: 'Courier New';
    font-size: 85%!important;
`;

class ExportToLatex extends Component {

    constructor(props) {
        super(props);

        this.state = {
            latexTable: '',
            selectedTab: 'table',
            bibtexReferences: '',
            bibtexReferencesLoading: true,
            replaceTitles: false,
            showTooltipCopiedBibtex: false,
            showTooltipCopiedLatex:false
        }
    }

    componentDidUpdate = (prevProps) => {
        if (this.props.contributions !== prevProps.contributions) {
            this.generateBibTex();
        }
    }

    generateLatex = () => {
        if (this.props.data.length === 0) {
            return '';
        }

        let res = [];
        let transposedData;
        let newTitles = null;
        let nbColumns = 0;

        if (!this.props.transpose) {
            transposedData = this.props.data[0].map((col, i) => this.props.data.map(row => row[i]));

            if (this.state.replaceTitles) {
                newTitles = ['Title'];
                let conTitles = ['Title'];
                transposedData[0].forEach((title, i) => {
                    if (i > 0) {
                        newTitles.push(` \\cite{${this.props.contributions[i - 1].paperId}} `);
                        conTitles.push(`${this.props.contributions[i - 1].id}`)
                    }
                });
                transposedData[0] = conTitles
            }

            transposedData.forEach((contribution, i) => {
                if (i > 0) {
                    let con = {};
                    contribution.forEach((item, j) => {
                        con[transposedData[0][j]] = item !== 'undefined' ? item : '-';
                    });
                    res.push(con);
                }
            });

            nbColumns = Object.keys(res[0]).length;
        } else {
            this.props.data.forEach((contribution, i) => {
                if (i > 0) {
                    let con = {};
                    contribution.forEach((item, j) => {
                        if (this.state.replaceTitles && j === 0) {
                            item = ` \\cite{${this.props.contributions[i - 1].paperId}}`;
                        }
                        con[this.props.data[0][j]] = item !== 'undefined' ? item : '-';
                    });
                    res.push(con);
                }
            });
            nbColumns = this.props.data[0].length
        }

        let latexTable;

        if (newTitles) {
            latexTable = MakeLatex(res, {
                'digits': 2,
                'colnames': newTitles,
                'spec': `|${Array(nbColumns).fill('c').join('|')}|`
            });
        } else {
            latexTable = MakeLatex(res, {
                'digits': 2,
                'spec': `|${Array(nbColumns).fill('c').join('|')}|`
            });
        }

        return latexTable;
    }

    parsePaperStatements = (paperStatements) => {
        // publication year
        let publicationYear = paperStatements.filter((statement) => statement.predicate.id === process.env.REACT_APP_PREDICATES_HAS_PUBLICATION_YEAR);

        if (publicationYear.length > 0) {
            publicationYear = publicationYear[0].object.label
        }

        // authors
        let authors = paperStatements.filter((statement) => statement.predicate.id === process.env.REACT_APP_PREDICATES_HAS_AUTHOR);

        let authorNamesArray = [];

        if (authors.length > 0) {
            for (let author of authors) {
                let authorName = author.object.label;
                authorNamesArray.push(authorName);
            }
        }

        return { authorNames: authorNamesArray.reverse(), publicationYear }
    }

    generateBibTex = () => {
        this.setState({ bibtexReferencesLoading: true });
        if (this.props.contributions.length === 0) {
            this.setState({ bibtexReferences: '', bibtexReferencesLoading: false });
            return '';
        }
        let contributions = this.props.contributions.map((contribution) => {
            // Fetch the data of each contribution
            return getStatementsBySubject(contribution.paperId).then((paperStatements) => {
                let publicationDOI = paperStatements.filter((statement) => statement.predicate.id === process.env.REACT_APP_PREDICATES_HAS_DOI);
                if (publicationDOI.length > 0) {
                    publicationDOI = publicationDOI[0].object.label
                    if (publicationDOI !== '') {
                        // Fetch the bibtex from crossRef for 4 seconds
                        return timeoutPromise(4000,
                            fetch(crossrefUrl + publicationDOI + '/transform/application/x-bibtex', { method: 'GET' }))
                            .then((response, reject) => {
                                if (!response.ok) {
                                    reject(new Error('CrossRef error'));
                                } else {
                                    return response.text();
                                }
                            }).then((response) => {
                                let refID = response.substring(response.indexOf("{") + 1, response.indexOf(","));
                                contribution.bibtex = response.replace(refID, contribution.paperId)
                                return contribution;
                            }).catch(() => {
                                let contributionData = this.parsePaperStatements(paperStatements);
                                contribution.bibtex = `@article{${contribution.paperId},\n author={${contributionData.authorNames.join(',')}},\n title={${contribution.title}},\n year={${contributionData.publicationYear}}\n}`
                                return contribution;
                            });
                    }
                }
                let contributionData = this.parsePaperStatements(paperStatements);
                contribution.bibtex = `@article{${contribution.paperId},\n author={${contributionData.authorNames.join(',')}},\n title={${contribution.title}},\n year={${contributionData.publicationYear}}\n}`
                return contribution;
            })

        });

        Promise.all(contributions).then((contributions) => {
            let res = [];
            let paperIds = [];
            contributions.forEach((contribution, i) => {
                if (!paperIds.includes(contribution.paperId)) {
                    paperIds.push(contribution.paperId);
                    res.push(contribution.bibtex);
                }
            });
            this.setState({ bibTexReferences: res.join('\n'), bibtexReferencesLoading: false });
        });
    }

    selectTab = (tab) => {
        this.setState({
            selectedTab: tab
        });
    }

    toggleCheckbox = (type) => {
        this.setState(prevState => ({
            replaceTitles: !prevState.replaceTitles,
        }));
    }

    toggleTooltip = (e, type) => {
        if (e && e.type !== 'mouseover') {
            this.setState(prevState => ({
                [type]: !prevState[type],
            }));
        }
    }

    render() {
        let latexTable;

        if (this.props.showDialog) {
            latexTable = this.generateLatex();
        }

        return (
            <Modal isOpen={this.props.showDialog} toggle={this.props.toggle} size="lg">
                <ModalHeader toggle={this.props.toggle}>LaTeX export</ModalHeader>
                <ModalBody>
                    <Nav tabs className="mb-4">
                        <NavItem>
                            <NavLink href="#" active={this.state.selectedTab === 'table'} onClick={() => this.selectTab('table')}>LaTeX table</NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink href="#" active={this.state.selectedTab === 'references'} onClick={() => this.selectTab('references')}>BibTeX references</NavLink>
                        </NavItem>
                    </Nav>

                    {this.state.selectedTab === 'table' &&
                        <>
                            <p>
                                <Textarea type="textarea" value={latexTable} disabled rows="15" />
                            </p>

                            <div className="float-left mt-1">
                                <Tooltip message="Since contribution titles can be long, it is sometimes better to replace the title by a reference like: Paper [1], Paper [2]...">
                                    <CustomInput
                                        className="float-left"
                                        type="checkbox"
                                        id={'replaceTitles'}
                                        label="Replace contribution titles by reference "
                                        onChange={this.toggleCheckbox}
                                        checked={this.state.replaceTitles}
                                    />{'. '}
                                </Tooltip>
                            </div>

                            <CopyToClipboard id="copyToClipboardLatex" text={latexTable} onCopy={() => { this.setState({ showTooltipCopiedLatex: true }); }}>
                                <Button
                                    color="primary"
                                    className="pl-3 pr-3 float-right"
                                    size="sm"

                                >
                                    <Icon icon={faClipboard} /> Copy to clipboard {/* TODO: show a success message after copy */}
                                </Button>

                            </CopyToClipboard>
                            <ReactstrapTooltip placement="top" target="copyToClipboardLatex" trigger={'hover'} toggle={(e) => this.toggleTooltip(e, 'showTooltipCopiedLatex')} isOpen={this.state.showTooltipCopiedLatex}>
                                Copied!
                            </ReactstrapTooltip>
                        </>}
                    {this.state.selectedTab === 'references' &&
                        <>
                            <p>
                                <Textarea type="textarea" value={!this.state.bibtexReferencesLoading ? this.state.bibTexReferences : 'Loading...'} disabled rows="15" />
                            </p>

                            <CopyToClipboard id="copyToClipboardBibtex" text={!this.state.bibtexReferencesLoading ? this.state.bibTexReferences : 'Loading...'} onCopy={() => { this.setState({ showTooltipCopiedBibtex: true }); }}>
                                <Button
                                    color="primary"
                                    className="pl-3 pr-3 float-right"
                                    size="sm"
                                >
                                    <Icon icon={faClipboard} /> Copy to clipboard {/* TODO: show a success message after copy */}
                                </Button>
                            </CopyToClipboard>
                            <ReactstrapTooltip placement="top" target="copyToClipboardBibtex" trigger={'hover'} toggle={(e) => this.toggleTooltip(e, 'showTooltipCopiedBibtex')} isOpen={this.state.showTooltipCopiedBibtex}>
                                Copied!
                            </ReactstrapTooltip>
                        </>}
                </ModalBody>
            </Modal>
        )
    }
}

ExportToLatex.propTypes = {
    data: PropTypes.array.isRequired,
    contributions: PropTypes.array.isRequired,
    showDialog: PropTypes.bool.isRequired,
    toggle: PropTypes.func.isRequired,
    transpose: PropTypes.bool.isRequired,
}

export default ExportToLatex;