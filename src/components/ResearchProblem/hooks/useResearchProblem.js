import { useState, useEffect, useCallback } from 'react';
import { getStatementsBySubject, getStatementsByObjectAndPredicate, getParentResearchProblems } from 'services/backend/statements';
import { getResource } from 'services/backend/resources';
import { useParams } from 'react-router-dom';
import { filterObjectOfStatementsByPredicate } from 'utils';
import { PREDICATES } from 'constants/graphSettings';

function useResearchProblem(initialVal = {}) {
    const [data, setData] = useState({ initialVal });
    const { researchProblemId } = useParams();
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isFailedLoadingData, setIsFailedLoadingData] = useState(true);
    const [parentResearchProblems, setParentResearchProblems] = useState([]);

    const loadResearchProblemData = useCallback(rpId => {
        if (rpId) {
            setIsLoadingData(true);
            // Get the research problem
            getResource(rpId)
                .then(result => {
                    setData({ id: rpId, label: result.label, superProblems: [], subProblems: [] });
                    setIsLoadingData(false);
                    setIsFailedLoadingData(false);
                    document.title = `${result.label} - ORKG`;
                })
                .catch(error => {
                    setIsLoadingData(false);
                    setIsFailedLoadingData(true);
                });

            // Get description, same as and sub-problems of the research problem
            getStatementsBySubject({ id: rpId }).then(statements => {
                const description = filterObjectOfStatementsByPredicate(statements, PREDICATES.DESCRIPTION, true);
                const sameAs = filterObjectOfStatementsByPredicate(statements, PREDICATES.SAME_AS, true);
                const subProblems = filterObjectOfStatementsByPredicate(statements, PREDICATES.SUB_PROBLEM, false);
                setData(data => ({ ...data, description: description?.label, sameAs: sameAs, subProblems: subProblems ?? [] }));
            });

            // Get super research problems
            getStatementsByObjectAndPredicate({
                objectId: rpId,
                predicateId: PREDICATES.SUB_PROBLEM
            }).then(superProblems => {
                setData(data => ({ ...data, superProblems: superProblems.map(s => s.subject) }));
            });

            // Get parent research problems for the breadcrumbs
            getParentResearchProblems(rpId).then(result => {
                setParentResearchProblems(result.reverse());
            });
        }
    }, []);

    useEffect(() => {
        if (researchProblemId !== undefined) {
            loadResearchProblemData(researchProblemId);
        }
    }, [researchProblemId, loadResearchProblemData]);
    return [data, parentResearchProblems, isLoadingData, isFailedLoadingData, loadResearchProblemData];
}
export default useResearchProblem;
