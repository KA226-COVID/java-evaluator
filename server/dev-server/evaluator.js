import xpath from 'xpath'
import { DOMParser } from 'xmldom'
import { loadSchemaPEARL, EvaluationReport } from "evaluation-report-juezlti";

function XPATH(programmingExercise, evalReq) {
    return new Promise((resolve) => {
        loadSchemaPEARL().then(() => {

            let evalRes = new EvaluationReport();
            evalRes.setRequest(evalReq.request)
            let program = evalReq.request.program
            let response = {}
            response.report = {}
            response.report.capability = {
                "id": "XPath-evaluator",
                "features": [{
                    "name": "language",
                    "value": "XPath"
                }, {
                    "name": "version",
                    "value": "1.0"
                }, {
                    "name": "engine",
                    "value": "https://www.npmjs.com/package/xpath"
                }]
            }

            response.report.exercise = programmingExercise.id
            response.report.compilationErrors = [];
            try {

                let solution_id = ""
                for (let solutions of programmingExercise.solutions) {
                    if (solutions.lang == "xml") {
                        solution_id = solutions.id
                        break;
                    }
                }
                const solution = programmingExercise.solutions_contents[solution_id]
                let i = 0;
                for (let metadata of programmingExercise.tests) {
                    let input = new DOMParser().parseFromString(programmingExercise.tests_contents_in[metadata.id]);
                    let teacherNode = null,
                        studentNode = null;


                    var teacherResult = xpath.evaluate(
                        solution, // xpathExpression
                        input, // contextNode
                        null, // namespaceResolver
                        xpath.XPathResult.ANY_TYPE, // resultType
                        null // result
                    )
                    var studentResult = xpath.evaluate(
                            program, // xpathExpression
                            input, // contextNode
                            null, // namespaceResolver
                            xpath.XPathResult.ANY_TYPE, // resultType
                            null // result
                        )
                        /*
        console.log(solution)
        console.log(program)

        console.log(teacherResult)

        console.log(studentResult)
            */
                    if (teacherResult.resultType == 1 || teacherResult.resultType == 2) {
                        if ("numberValue" in teacherResult)
                            if (teacherResult.numberValue != studentResult.numberValue) {

                                response.report.compilationErrors.push(`{"${i}":"incorrect xpath expression"}`)

                            }
                        if ("stringValue:" in teacherResult)
                            if (teacherResult.stringValue != studentResult.stringValue) {
                                response.report.compilationErrors.push(`{"${i}":"incorrect xpath expression"}`)


                            }

                    } else if (teacherResult.resultType == 4 || teacherResult.resultType == 5) {
                        teacherNode = teacherResult.iterateNext();
                        studentNode = studentResult.iterateNext();
                        console.log("teacher node " + teacherNode)
                        if (teacherNode == undefined) {
                            response.report.compilationErrors.push(`{"${i}":"incorrect xpath expression"}`)

                        } else {
                            while (teacherNode) {
                                if (teacherNode != studentNode) {
                                    response.report.compilationErrors.push(`{"${i}":"incorrect xpath expression"}`)
                                    break;
                                }
                                teacherNode = teacherResult.iterateNext();
                                studentNode = studentResult.iterateNext();
                            }

                        }
                    }
                    i++;
                }

                evalRes.setReply(response)
                resolve(evalRes)
            } catch (error) {
                console.log(error)
                response.report.compilationErrors.push("impossibleToEvaluate")
                evalRes.setReply(response)
                resolve(evalRes)

            }
        })
    })

}

module.exports = {
    XPATH
}