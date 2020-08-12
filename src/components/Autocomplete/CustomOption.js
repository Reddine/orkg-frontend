import React from 'react';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import Tippy from '@tippy.js/react';
import { components } from 'react-select';
import styled from 'styled-components';
import { PREDICATES } from 'constants/graphSettings';
import PropTypes from 'prop-types';

const StyledSelectOption = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;

    .badge {
        background-color: #ebecf0;
        border-radius: 2em;
        color: #172b4d;
        display: inline-block;
        font-size: 12;
        font-weight: normal;
        line-height: '1';
        min-width: 1;
        padding: 0.16666666666667em 0.5em;
        text-align: center;
    }

    .info {
        display: inline-block;
        font-weight: normal;
        line-height: '1';
        min-width: 1;
        text-align: center;
        cursor: default;
    }
`;

export default function CustomOption(props) {
    const { innerProps, ...propsWithoutInnerProps } = props;
    const { onClick, ...newInnerProps } = innerProps;
    return (
        <components.Option {...propsWithoutInnerProps} innerProps={newInnerProps}>
            <StyledSelectOption>
                <span onClick={onClick} style={{ flex: 1 }}>
                    {props.children}
                </span>
                <span>
                    {props.data.tooltipData && props.data.tooltipData.length > 0 && (
                        <div className="info">
                            <Tippy
                                interactive={true}
                                key="c"
                                content={
                                    <div className="text-left">
                                        {props.data.tooltipData.map((info, index) => (
                                            <div key={`s${index}`}>
                                                <b>{info.property} : </b> {info.value}
                                            </div>
                                        ))}
                                        {props.data.statements
                                            .filter(statement => statement.predicate.id === PREDICATES.URL)
                                            .map((statement, index) => (
                                                <div key={`s${index}`}>
                                                    <b>URL : </b>{' '}
                                                    <a target="_blank" rel="noopener noreferrer" href={statement.value.label}>
                                                        {statement.value.label}
                                                    </a>
                                                </div>
                                            ))}
                                    </div>
                                }
                            >
                                <span>
                                    <Icon icon={faInfoCircle} />
                                </span>
                            </Tippy>
                        </div>
                    )}
                    <span onClick={onClick} className="badge">
                        {props.data.id}
                    </span>
                </span>
            </StyledSelectOption>
        </components.Option>
    );
}

CustomOption.propTypes = {
    children: PropTypes.node.isRequired,
    data: PropTypes.object.isRequired,
    innerProps: PropTypes.object.isRequired
};
